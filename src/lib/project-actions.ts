"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "./access";
import { firstReferral, projectDetails } from "./data";
import { audit, InputError, notice, transaction } from "./db";
import { code, dateTime, today } from "./format";
import { amount, day, httpUrl, required, value, vietnamTimestamp, type FormResult, type PaymentSchedule, type QuoteResult } from "./forms";
import { commissionAmount, finance, qualifyingReferral, referralDeadline } from "./rules";
import { runForm } from "./run-form";

function paymentSchedule(form: FormData): PaymentSchedule {
  const labels = form.getAll("scheduleLabel");
  const amounts = form.getAll("scheduleAmount");
  const dates = form.getAll("scheduleDue");
  if (!labels.length || amounts.length !== labels.length || dates.length !== labels.length) {
    throw new InputError("Nhập ít nhất một đợt thanh toán đầy đủ.");
  }
  return labels.map((label, i) => {
    const fields = new FormData();
    fields.set("label", label);
    fields.set("amount", amounts[i]);
    fields.set("due", dates[i]);
    return {
      label: required(fields, "label", "tên đợt thanh toán " + (i + 1), 120),
      amount: amount(fields, "amount").toString(),
      due: day(fields, "due"),
    };
  });
}

export async function manageQuote(form: FormData): Promise<QuoteResult> {
  const admin = await requireUser("admin");
  return runForm<QuoteResult>(async () => {
    const operation = value(form, "operation");
    const result = await transaction(async (tx): Promise<QuoteResult | undefined> => {
      const request = await tx.projectRequest.findUnique({
        where: { id: required(form, "requestId", "yêu cầu") },
      });
      if (!request || ["ACCEPTED", "CLOSED"].includes(request.status)) throw new InputError("Yêu cầu đã kết thúc.");
      if (operation === "create") {
        const price = amount(form, "price");
        const startsOn = day(form, "startsOn");
        const dueOn = day(form, "dueOn");
        if (dueOn < startsOn) throw new InputError("Ngày bàn giao phải cùng ngày hoặc sau ngày bắt đầu.");
        const schedule = paymentSchedule(form);
        if (schedule.reduce((a, item) => a + BigInt(item.amount), 0n) !== price) throw new InputError("Tổng các đợt thanh toán phải bằng giá phát triển.");
        const last = await tx.quote.findFirst({ where: { requestId: request.id }, orderBy: { version: "desc" } });
        await tx.quote.create({ data: {
          requestId: request.id, version: (last?.version ?? 0) + 1, price, startsOn, dueOn, schedule,
          scope: required(form, "scope", "phạm vi"),
          deliverables: required(form, "deliverables", "sản phẩm bàn giao"),
          warranty: required(form, "warranty", "thỏa thuận bảo hành"),
          hosting: required(form, "hosting", "thỏa thuận hosting"),
          terms: value(form, "terms"), allowEarlyDelivery: form.get("allowEarlyDelivery") === "on",
        } });
        if (request.status === "NEW") await tx.projectRequest.update({ where: { id: request.id }, data: { status: "DISCUSSING" } });
        return;
      }
      const quote = await tx.quote.findFirst({ where: { id: value(form, "quoteId"), requestId: request.id } });
      if (!quote) throw new InputError("Không tìm thấy báo giá.");
      if (operation === "send" && quote.status === "DRAFT") {
        const lastSent = await tx.quote.findFirst({
          where: { requestId: request.id, sentAt: { not: null } }, orderBy: { version: "desc" },
        });
        if (lastSent && lastSent.version > quote.version) throw new InputError("Đã có phiên bản mới hơn được gửi.");
        const sentAt = vietnamTimestamp(form, "sentAt", lastSent?.sentAt ?? request.createdAt,
          "Giờ gửi phải từ lúc nhận yêu cầu hoặc lần gửi báo giá trước đó đến hiện tại", true);
        await tx.quote.updateMany({ where: {
          requestId: request.id, version: { lt: quote.version }, status: { in: ["DRAFT", "SENT"] },
        }, data: { status: "SUPERSEDED" } });
        await tx.quote.update({ where: { id: quote.id }, data: { status: "SENT", sentAt } });
        await tx.projectRequest.update({ where: { id: request.id }, data: { status: "QUOTED" } });
        if (request.affiliateId) await notice(tx, request.affiliateId, "Yêu cầu " + code("YC", request.number) + " đã được báo giá.", "/affiliate");
        return;
      }
      if (operation === "reject" && quote.status === "SENT") {
        await tx.quote.update({ where: { id: quote.id }, data: { status: "REJECTED" } });
        await tx.projectRequest.update({ where: { id: request.id }, data: { status: "DISCUSSING" } });
        return;
      }
      if (!["review", "accept"].includes(operation) || quote.status !== "SENT" || !quote.sentAt) {
        throw new InputError("Chỉ xác nhận báo giá đang ở trạng thái đã gửi.");
      }
      const acceptedAt = vietnamTimestamp(form, "acceptedAt", quote.sentAt,
        "Giờ khách xác nhận phải từ lúc gửi báo giá đến hiện tại");
      const evidence = required(form, "evidence", "nội dung hoặc liên kết xác nhận của khách");
      const alreadyHasProject = !!await tx.project.findFirst({ where: { customerId: request.customerId } });
      const oldest = await firstReferral(tx, request.customerId);
      const candidate = qualifyingReferral(oldest, acceptedAt, alreadyHasProject);
      const rateBps = candidate ? (await tx.settings.findUnique({ where: { id: 1 } }))?.commissionBps : null;
      if (candidate && rateBps == null) throw new InputError("Cài tỷ lệ hoa hồng trước khi chốt.");
      const commission = rateBps == null ? null : commissionAmount(quote.price, rateBps);
      const deadline = oldest ? referralDeadline(oldest) : null;
      // Rebuild from database values inside the same transaction used to create the project.
      const confirmation = createHash("sha256").update(JSON.stringify([
        quote.id, quote.price.toString(), +acceptedAt, evidence,
        candidate?.id, candidate?.affiliateId, deadline?.getTime(), rateBps,
        oldest?.id, alreadyHasProject,
      ])).digest("hex");
      const review = {
        confirmation, version: quote.version, price: quote.price.toString(),
        affiliate: candidate && rateBps != null && commission !== null ? {
          name: candidate.affiliate?.name ?? "Affiliate",
          deadline: dateTime(referralDeadline(candidate)),
          rateBps, amount: commission.toString(),
        } : null,
        reason: alreadyHasProject ? "Khách đã có dự án trước đó."
          : !oldest ? "Không có lượt giới thiệu hợp lệ."
          : !candidate && deadline ? (+acceptedAt < +oldest.createdAt
            ? "Khách xác nhận trước khi có lượt giới thiệu."
            : "Đã quá hạn ghi nhận " + dateTime(deadline) + ".") : undefined,
      };
      if (operation === "review") return { review };
      if (value(form, "confirmation", 64) !== confirmation) {
        return { error: "Thông tin chốt đã thay đổi. Kiểm tra lại bản xem trước bên dưới rồi xác nhận.", review };
      }
      const p = await tx.project.create({ data: { requestId: request.id, customerId: request.customerId, quoteId: quote.id } });
      await tx.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED", acceptedAt, evidence } });
      await tx.projectRequest.update({ where: { id: request.id }, data: { status: "ACCEPTED" } });
      if (candidate?.affiliateId && rateBps != null && commission !== null) {
        await tx.commission.create({ data: {
          projectId: p.id, customerId: request.customerId, affiliateId: candidate.affiliateId, sourceId: candidate.id,
          rateBps, base: quote.price, original: commission,
        } });
        await notice(tx, candidate.affiliateId, "Đã chốt dự án " + code("DA", p.number), "/affiliate");
      }
      await audit(tx, admin.id, p.id, "Chốt dự án", "Báo giá phiên bản " + quote.version);
    });
    if (result) return result;
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: operation === "accept" ? "Đã chốt báo giá và tạo dự án." : "Đã cập nhật báo giá." };
  });
}

export async function manageProject(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const id = required(form, "projectId", "dự án");
    const operation = value(form, "operation");
    await transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id }, include: projectDetails });
      if (!project) throw new InputError("Không tìm thấy dự án.");
      const f = finance(project);
      if (operation === "notes") {
        await tx.project.update({ where: { id }, data: {
          internalNote: value(form, "internalNote"), sharedNote: value(form, "sharedNote"), documents: value(form, "documents"),
          demo: httpUrl(value(form, "demo")), repository: httpUrl(value(form, "repository")),
        } });
        return;
      }
      if (project.status === "CANCELLED") throw new InputError("Dự án đã hủy.");
      if (operation === "task") {
        await tx.projectTask.create({ data: { projectId: id, title: required(form, "title", "tên việc", 160) } });
        return;
      }
      if (operation === "toggle-task") {
        await tx.projectTask.updateMany({ where: { projectId: id, id: value(form, "taskId") }, data: { done: form.get("next") === "true" } });
        return;
      }
      if (operation === "extra") {
        await tx.extraQuote.create({ data: {
          projectId: id, scope: required(form, "scope", "phạm vi bổ sung"), price: amount(form, "price"),
          eligible: form.get("eligible") === "on",
        } });
        return;
      }
      if (operation === "accept-extra") {
        const evidence = required(form, "proof", "xác nhận của khách");
        const result = await tx.extraQuote.updateMany({ where: { projectId: id, id: value(form, "extraId"), acceptedAt: null }, data: {
          acceptedAt: new Date(), evidence,
        } });
        if (!result.count) throw new InputError("Báo giá bổ sung đã được xử lý.");
        await audit(tx, admin.id, id, "Xác nhận phát sinh");
        if (project.commission) await notice(tx, project.commission.affiliateId, "Dự án " + code("DA", project.number) + " có báo giá bổ sung đã xác nhận.", "/affiliate");
        return;
      }
      let transitionDetail = project.status + " → " + operation;
      if (operation === "start" && project.status === "DEPOSIT") {
        const reason = f.net > 0n ? "Đã thu tiền phát triển" : required(form, "proof", "lý do bắt đầu khi chưa thu cọc");
        await tx.project.update({ where: { id }, data: { status: "ACTIVE" } });
        await audit(tx, admin.id, id, "Bắt đầu dự án", reason);
      } else if (operation === "review" && project.status === "ACTIVE") {
        transitionDetail += " · " + required(form, "proof", "thông tin bản demo hoặc cập nhật đã gửi");
        await tx.project.update({ where: { id }, data: { status: "REVIEW" } });
      } else if (operation === "resume" && project.status === "REVIEW") {
        await tx.project.update({ where: { id }, data: { status: "ACTIVE" } });
      } else if (operation === "deliver" && ["ACTIVE", "REVIEW"].includes(project.status)) {
        if (f.balance > 0n && !project.quote.allowEarlyDelivery) throw new InputError("Cần thu đủ hoặc có thỏa thuận cho phép bàn giao trước.");
        const deliveryProof = required(form, "proof", "thông tin bàn giao");
        await tx.project.update({ where: { id }, data: { status: "DELIVERED", deliveryProof, deliveredAt: new Date() } });
      } else if (operation === "complete" && project.status === "DELIVERED") {
        const acceptanceProof = required(form, "proof", "thông tin nghiệm thu");
        await tx.project.update({ where: { id }, data: { status: "COMPLETE", acceptanceProof, completedAt: new Date() } });
      } else if (operation === "cancel" && project.status !== "COMPLETE") {
        const cancellation = required(form, "proof", "lý do hủy dự án");
        await tx.project.update({ where: { id }, data: { status: "CANCELLED", cancellation } });
      } else throw new InputError("Trạng thái dự án không phù hợp.");
      await audit(tx, admin.id, id, "Cập nhật tiến độ", transitionDetail);
      if (project.commission) await notice(tx, project.commission.affiliateId, "Tiến độ dự án " + code("DA", project.number) + " vừa thay đổi.", "/affiliate");
    });
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: "Đã cập nhật dự án." };
  });
}

export async function manageMoney(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const id = required(form, "projectId", "dự án");
    const operation = value(form, "operation");
    await transaction(async (tx) => {
      const p = await tx.project.findUnique({ where: { id }, include: projectDetails });
      if (!p) throw new InputError("Không tìm thấy dự án.");
      const f = finance(p);
      if (operation === "receipt" || operation === "refund") {
        const group = value(form, "group");
        if (group !== "DEVELOPMENT" && group !== "HOSTING") throw new InputError("Chọn nhóm khoản tiền.");
        const money = amount(form, "amount");
        const occurredOn = day(form, "occurredOn");
        if (occurredOn > today()) throw new InputError("Ngày giao dịch không được ở tương lai.");
        const note = value(form, "note");
        const net = group === "DEVELOPMENT" ? f.net : f.hosting;
        if (operation === "refund" && (money > net || !note)) throw new InputError("Tiền hoàn không vượt thực thu và cần lý do.");
        if (operation === "receipt" && group === "DEVELOPMENT" && money > f.balance && !note) throw new InputError("Nhập lý do nếu thu vượt số còn thiếu.");
        await tx.moneyMovement.create({ data: {
          projectId: id, type: operation === "receipt" ? "RECEIPT" : "REFUND", group, amount: money, occurredOn, note,
          label: required(form, "label", "nội dung giao dịch", 160), evidence: value(form, "evidence"),
        } });
      } else if (operation === "void") {
        const row = p.movements.find((m) => m.id === value(form, "movementId") && !m.voidedAt);
        if (!row) throw new InputError("Không tìm thấy khoản tiền đang có hiệu lực.");
        const net = row.group === "DEVELOPMENT" ? f.net : f.hosting;
        if (row.type === "RECEIPT" && net < row.amount) throw new InputError("Khoản thu đã được hoàn. Đối soát khoản hoàn trước khi hủy.");
        await tx.moneyMovement.update({ where: { id: row.id }, data: {
          voidedAt: new Date(), voidReason: required(form, "reason", "lý do hủy bản ghi"),
        } });
      } else if (operation === "hold" || operation === "release" || operation === "reduction") {
        if (!p.commission || !f.commission || p.status === "CANCELLED") throw new InputError("Dự án không có hoa hồng còn hiệu lực.");
        const reason = required(form, "reason", "lý do");
        if (operation === "reduction") {
          const reduction = amount(form, "amount");
          if (f.commission.paid === 0n || reduction > f.commission.earned) {
            throw new InputError("Chỉ ghi khoản giảm đã thống nhất sau khi trả, tối đa bằng hoa hồng hiện tại.");
          }
          await tx.commissionAdjustment.create({ data: { commissionId: p.commission.id, reduction, reason } });
        } else {
          await tx.commission.update({ where: { id: p.commission.id }, data: { holdReason: operation === "hold" ? reason : null } });
        }
      } else throw new InputError("Thao tác không hợp lệ.");
      await audit(tx, admin.id, id, "Cập nhật tài chính", operation + (value(form, "reason") ? " · " + value(form, "reason") : ""));
      if (p.commission) {
        const after = await tx.project.findUniqueOrThrow({ where: { id }, include: projectDetails });
        const next = finance(after).commission;
        if (next?.status !== f.commission?.status || operation === "reduction") {
          await notice(tx, p.commission.affiliateId, "Hoa hồng " + code("DA", p.number) + ": " + next?.status, "/affiliate");
        }
      }
    });
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: "Đã lưu thay đổi tài chính." };
  });
}

export async function recordPayout(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const ids = [...new Set(form.getAll("commission").map(String))];
    if (ids.length === 0 || ids.length > 50) throw new InputError("Chọn từ 1 đến 50 khoản của cùng một affiliate.");
    const occurredOn = day(form, "occurredOn");
    const reference = required(form, "reference", "mã giao dịch", 120);
    if (occurredOn > today()) throw new InputError("Ngày giao dịch không được ở tương lai.");
    await transaction(async (tx) => {
      const commissions = await tx.commission.findMany({ where: { id: { in: ids } }, include: {
        affiliate: { select: { id: true, name: true, bankDetails: true } },
        project: { include: projectDetails },
      } });
      if (commissions.length !== ids.length || new Set(commissions.map((c) => c.affiliateId)).size !== 1) {
        throw new InputError("Các khoản phải thuộc cùng một affiliate.");
      }
      const affiliate = commissions[0].affiliate;
      const lines = commissions.map((c) => ({ commissionId: c.id, amount: finance(c.project).commission?.payable ?? 0n }));
      if (lines.some((line) => line.amount === 0n)) throw new InputError("Có khoản đã trả hoặc chưa đủ điều kiện.");
      const total = lines.reduce((sum, line) => sum + line.amount, 0n);
      if (amount(form, "amount") !== total) throw new InputError("Số tiền chuyển không khớp các khoản đã chọn.");
      const recipient = required(form, "recipient", "thông tin người nhận", 350);
      const payment = await tx.payout.create({ data: {
        affiliateId: affiliate.id, reference, occurredOn, amount: total, recipient,
        evidence: value(form, "evidence"), lines: { create: lines },
      } });
      await audit(tx, admin.id, payment.id, "Ghi nhận lần trả", reference);
      await notice(tx, affiliate.id, "Đã ghi nhận lần trả " + reference, "/affiliate");
    });
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: "Đã ghi nhận chuyển hoa hồng." };
  });
}

export async function voidPayout(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const id = required(form, "id", "lần trả");
    const reason = required(form, "reason", "lý do hủy");
    await transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id } });
      if (!payout || payout.voidedAt) throw new InputError("Lần trả đã được xử lý.");
      await tx.payout.update({ where: { id }, data: { voidedAt: new Date(), voidReason: reason } });
      await audit(tx, admin.id, id, "Hủy bản ghi lần trả", reason);
      await notice(tx, payout.affiliateId, "Bản ghi lần trả " + payout.reference + " đã được hủy: " + reason, "/affiliate");
    });
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: "Đã hủy bản ghi. Giao dịch ngân hàng không thay đổi." };
  });
}
