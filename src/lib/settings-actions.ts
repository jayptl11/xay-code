"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "./access";
import { audit, db, InputError, notice, transaction } from "./db";
import { normalizePhone } from "./format";
import { email, httpUrl, required, value, type FormResult } from "./forms";
import { runForm } from "./run-form";

export async function saveSettings(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const rawRate = value(form, "rate", 8);
    if (rawRate && !/^\d{1,3}(?:[.,]\d{1,2})?$/.test(rawRate)) throw new InputError("Nhập tỷ lệ phần trăm với tối đa 2 chữ số thập phân.");
    const commissionBps = rawRate ? Math.round(Number(rawRate.replace(",", ".")) * 100) : null;
    if (commissionBps !== null && commissionBps > 10000) throw new InputError("Tỷ lệ không vượt quá 100%.");
    const contactEmail = email(form, "contactEmail");
    const zalo = httpUrl(value(form, "zalo", 500));
    const process = value(form, "process");
    await transaction(async (tx) => {
      const previous = await tx.settings.findUnique({ where: { id: 1 } });
      const data = { commissionBps, contactEmail, zalo, process };
      await tx.settings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
      if ((previous?.commissionBps ?? null) !== commissionBps) {
        await audit(tx, admin.id, "settings", "Đổi tỷ lệ hoa hồng", String(previous?.commissionBps ?? "chưa đặt") + " → " + String(commissionBps) + " bps");
      }
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: "Đã lưu cài đặt." };
  });
}

export async function publishPolicy(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const body = required(form, "body", "nội dung chính sách", 10000);
    await transaction(async (tx) => {
      const current = await tx.policy.findFirst({ orderBy: { version: "desc" } });
      if (current?.body === body) throw new InputError("Chính sách chưa thay đổi.");
      const policy = await tx.policy.create({ data: { body } });
      await audit(tx, admin.id, String(policy.version), "Công bố chính sách cộng tác viên");
    });
    revalidatePath("/chinh-sach");
    revalidatePath("/admin");
    revalidatePath("/affiliate");
    return { success: "Đã công bố phiên bản mới. Cộng tác viên cần đồng ý lại." };
  });
}

export async function saveContent(form: FormData): Promise<FormResult> {
  await requireUser("admin");
  return runForm(async () => {
    const id = value(form, "id");
    const type = value(form, "type");
    if (type !== "SERVICE" && type !== "PORTFOLIO") throw new InputError("Chọn loại nội dung.");
    const published = form.get("published") === "on";
    const consent = form.get("consent") === "on";
    if (type === "PORTFOLIO" && published && !consent) throw new InputError("Chỉ công khai dự án khi khách đã đồng ý.");
    const position = Number(value(form, "position") || "0");
    if (!Number.isInteger(position) || position < 0 || position > 10000) throw new InputError("Thứ tự phải từ 0 đến 10000.");
    const data = {
      type, published, consent, position, title: required(form, "title", "tiêu đề", 160),
      description: required(form, "description", "mô tả"), stack: value(form, "stack", 160),
      imageUrl: httpUrl(value(form, "imageUrl", 500)), demoUrl: httpUrl(value(form, "demoUrl", 500)),
    } as const;
    if (id) await db.content.update({ where: { id }, data });
    else await db.content.create({ data });
    revalidatePath("/");
    revalidatePath("/admin/cai-dat");
    return { success: "Đã lưu nội dung." };
  });
}

export async function saveAffiliateProfile(form: FormData): Promise<FormResult> {
  const user = await requireUser("affiliate");
  return runForm(async () => {
    const phone = normalizePhone(required(form, "phone", "số điện thoại", 32));
    const newEmail = email(form, "email");
    const name = required(form, "name", "họ tên", 120);
    if (!phone || !newEmail) throw new InputError("Nhập số điện thoại và email hợp lệ.");
    const pendingBank = value(form, "bank", 350);
    await transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: {
        name, phone, email: newEmail, ...(newEmail !== user.email ? { emailVerified: false } : {}),
        ...(pendingBank && pendingBank !== user.bankDetails ? { pendingBank } : {}),
      } });
      if (pendingBank && pendingBank !== user.bankDetails) await notice(tx, null, "Có thay đổi ngân hàng chờ duyệt.", "/admin/affiliate");
    });
    revalidatePath("/affiliate");
    return { success: "Đã lưu thông tin tài khoản." };
  });
}

export async function approveBank(form: FormData): Promise<FormResult> {
  const admin = await requireUser("admin");
  return runForm(async () => {
    const id = required(form, "id", "cộng tác viên");
    await transaction(async (tx) => {
      const user = await tx.user.findFirst({ where: { id, role: "affiliate" } });
      if (!user?.pendingBank) throw new InputError("Không có thay đổi chờ duyệt.");
      const approve = form.get("approve") === "on";
      await tx.user.update({ where: { id }, data: {
        pendingBank: null, ...(approve ? { bankDetails: user.pendingBank } : {}),
      } });
      await audit(tx, admin.id, id, approve ? "Xác nhận thông tin ngân hàng" : "Từ chối thông tin ngân hàng");
      await notice(tx, id, approve ? "Đã xác nhận thông tin ngân hàng." : "Thay đổi ngân hàng chưa được chấp nhận.", "/affiliate/tai-khoan");
    });
    revalidatePath("/admin/affiliate");
    revalidatePath("/affiliate");
    return { success: "Đã xử lý thay đổi ngân hàng." };
  });
}

export async function readNotices(): Promise<FormResult> {
  const user = await requireUser();
  await db.notice.updateMany({ where: { userId: user.role === "admin" ? null : user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath(user.role === "admin" ? "/admin" : "/affiliate");
  return { success: "Đã đánh dấu đã đọc." };
}
