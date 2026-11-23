"use server";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "./access";
import { ensurePolicy, firstReferral } from "./data";
import { audit, InputError, notice, transaction } from "./db";
import { code, DAY, normalizePhone } from "./format";
import { day, email, httpUrl, required, value, type FormResult } from "./forms";
import { referralDeadline } from "./rules";
import { runForm } from "./run-form";
import { OTHER_SERVICE, publishedServiceFilter } from "./services";

export async function acceptPolicy(version: number): Promise<FormResult> {
  const user = await requireUser("affiliate");
  return runForm(async () => {
    await ensurePolicy();
    await transaction(async (tx) => {
      const policy = await tx.policy.findFirst({ orderBy: { version: "desc" } });
      if (policy?.version !== version) throw new InputError("Chính sách đã cập nhật. Tải lại trang và đọc phiên bản mới trước khi đồng ý.");
      await tx.policyAcceptance.upsert({
        where: { userId_version: { userId: user.id, version } },
        create: { userId: user.id, version }, update: {},
      });
    });
    revalidatePath("/affiliate");
    revalidatePath("/affiliate/gui-yeu-cau");
    return { success: "Đã ghi nhận đồng ý chính sách." };
  });
}

async function submit(form: FormData, affiliateSubmission: boolean) {
  return runForm(async () => {
    const actor = affiliateSubmission ? await requireUser("affiliate") : null;
    if (actor) await ensurePolicy();
    if (value(form, "website")) throw new InputError("Không gửi được yêu cầu.");
    if (form.get("consent") !== "on") throw new InputError("Xác nhận đồng ý lưu thông tin liên hệ.");
    const name = required(form, "name", "tên người liên hệ", 120);
    const mail = email(form, "email");
    const phoneInput = value(form, "phone", 32);
    const phone = phoneInput ? normalizePhone(phoneInput) : null;
    if ((!mail && !phone) || (phoneInput && !phone)) throw new InputError("Nhập số điện thoại hợp lệ hoặc email.");
    const serviceId = required(form, "category", "loại dự án", 120);
    const description = required(form, "description", "mô tả yêu cầu", 5000);
    if (description.length < 20) throw new InputError("Mô tả rõ yêu cầu, tối thiểu 20 ký tự.");
    const links = value(form, "links", 1800);
    for (const link of links.split(/\s+/).filter(Boolean)) httpUrl(link);
    const key = actor?.id ?? (await headers()).get("x-real-ip") ?? "local";
    const submissionKey = createHash("sha256").update((process.env.BETTER_AUTH_SECRET ?? "") + key).digest("hex");
    const rawRef = actor ? actor.affiliateCode : (await cookies()).get("xayma_ref")?.value;
    const referralCode = rawRef?.slice(0, 48) || null;
    const identities = [mail && "email:" + mail, phone && "phone:" + phone].filter((x): x is string => !!x);
    const request = await transaction(async (tx) => {
      if (actor) {
        const policy = await tx.policy.findFirst({ orderBy: { version: "desc" } });
        if (!policy || !await tx.policyAcceptance.findUnique({ where: { userId_version: { userId: actor.id, version: policy.version } } })) {
          throw new InputError("Đọc và đồng ý chính sách cộng tác viên trước khi gửi.");
        }
      }
      const recent = await tx.projectRequest.count({ where: { submissionKey, createdAt: { gte: new Date(Date.now() - DAY / 24) } } });
      if (recent >= 10) throw new InputError("Bạn vừa gửi nhiều yêu cầu. Vui lòng thử lại sau.");
      const service = serviceId === OTHER_SERVICE ? null : await tx.content.findFirst({
        where: { ...publishedServiceFilter, id: serviceId },
        select: { title: true },
      });
      if (!service && serviceId !== OTHER_SERVICE) throw new InputError("Loại dự án này không còn trong danh sách. Tải lại trang để chọn lại.");
      const category = service?.title ?? "Khác";
      const found = await tx.customerIdentity.findMany({ where: { key: { in: identities } } });
      const customerIds = [...new Set(found.map((entry) => entry.customerId))];
      if (customerIds.length > 1) throw new InputError("Thông tin liên hệ đang thuộc hai hồ sơ. Dùng một thông tin hoặc liên hệ trực tiếp.");
      const customer = customerIds[0] ? { id: customerIds[0] } : await tx.customer.create({ data: {} });
      await tx.customerIdentity.createMany({ data: identities.filter((id) => !found.some((entry) => entry.key === id))
        .map((id) => ({ key: id, customerId: customer.id })) });
      const affiliate = referralCode ? await tx.user.findFirst({
        where: { affiliateCode: referralCode, role: "affiliate", OR: [{ banned: false }, { banned: null }] },
        select: { id: true },
      }) : null;
      if (actor && affiliate?.id !== actor.id) throw new InputError("Tài khoản hiện không thể gửi yêu cầu.");
      const row = await tx.projectRequest.create({ data: {
        customerId: customer.id, name, email: mail, phone, category, description, links,
        title: value(form, "title", 160) || category,
        company: value(form, "company", 120) || null,
        budget: value(form, "budget", 120), timeline: value(form, "timeline", 120),
        preliminary: actor ? value(form, "preliminary", 120) : null,
        submittedNote: actor ? value(form, "submittedNote", 2000) : null,
        source: actor ? "AFFILIATE" : referralCode ? "LINK" : "DIRECT",
        affiliateId: affiliate?.id, referralCode, submissionKey,
      } });
      await notice(tx, null, "Yêu cầu mới " + code("YC", row.number), "/admin/yeu-cau/" + row.id);
      return row;
    });
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    const message = actor ? "Admin sẽ xem xét yêu cầu trước khi báo giá."
      : "Xây Code sẽ liên hệ với bạn qua thông tin bạn đã để lại.";
    return { success: "Đã gửi yêu cầu " + code("YC", request.number) + ". " + message };
  });
}

export async function submitPublic(form: FormData) { return submit(form, false); }
export async function submitAffiliate(form: FormData) { return submit(form, true); }

export async function manageRequest(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const id = required(form, "id", "yêu cầu");
    const action = value(form, "operation");
    await transaction(async (tx) => {
      const row = await tx.projectRequest.findUnique({ where: { id } });
      if (!row) throw new InputError("Không tìm thấy yêu cầu.");
      if (action === "note") {
        await tx.projectRequest.update({ where: { id }, data: { internalNote: value(form, "internalNote") } });
      } else {
        if (row.status === "ACCEPTED" || row.status === "CLOSED") throw new InputError("Yêu cầu đã kết thúc.");
        if (action === "discuss" && row.status === "NEW") {
          await tx.projectRequest.update({ where: { id }, data: { status: "DISCUSSING" } });
        } else if (action === "close") {
          const closeReason = required(form, "reason", "lý do đóng yêu cầu");
          await tx.projectRequest.update({ where: { id }, data: { status: "CLOSED", closeReason } });
          await audit(tx, admin.id, id, "Đóng yêu cầu", closeReason);
        } else if (action === "extend") {
          const initial = await firstReferral(tx, row.customerId);
          if (initial?.id !== id || !["DISCUSSING", "QUOTED"].includes(row.status) ||
              await tx.project.count({ where: { customerId: row.customerId } })) {
            throw new InputError("Chỉ gia hạn yêu cầu giới thiệu đầu đang thương lượng của khách chưa có dự án.");
          }
          const extendedUntil = new Date(day(form, "until") + "T23:59:59.999+07:00");
          if (+extendedUntil <= Math.max(Date.now(), +referralDeadline(row))) throw new InputError("Hạn mới phải sau hạn hiện tại.");
          const extendReason = required(form, "reason", "lý do gia hạn");
          await tx.projectRequest.update({ where: { id }, data: { extendedUntil, extendReason } });
          await audit(tx, admin.id, id, "Gia hạn giới thiệu", extendReason);
        } else throw new InputError("Trạng thái yêu cầu không phù hợp.");
      }
      if (row.affiliateId && action !== "note") await notice(tx, row.affiliateId, "Yêu cầu " + code("YC", row.number) + " vừa được cập nhật.", "/affiliate");
    });
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: "Đã lưu yêu cầu." };
  });
}
