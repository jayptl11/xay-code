"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "./auth";
import { requireUser } from "./access";
import { db } from "./db";
import { normalizePhone } from "./format";
import { email, required, type FormResult } from "./forms";
import { runForm } from "./run-form";

const attempts = new Map<string, { count: number; until: number }>();

export async function signIn(form: FormData): Promise<FormResult> {
  return runForm(async () => {
    const login = email(form, "email");
    const password = String(form.get("password") ?? "");
    if (!login || !password) return { error: "Nhập email và mật khẩu." };
    const requestHeaders = await headers();
    const client = requestHeaders.get("x-real-ip") ?? "local";
    const now = Date.now();
    if (attempts.size >= 1000) {
      for (const [address, rate] of attempts) if (rate.until <= now) attempts.delete(address);
      if (attempts.size >= 1000 && !attempts.has(client)) return { error: "Vui lòng thử đăng nhập lại sau." };
    }
    const previous = attempts.get(client);
    const rate = previous && previous.until > now ? previous : { count: 0, until: now + 60_000 };
    if (rate.count >= 20) return { error: "Bạn đã thử đăng nhập nhiều lần. Vui lòng chờ một phút." };
    rate.count += 1;
    attempts.set(client, rate);
    let account;
    try {
      account = await auth.api.signInEmail({ headers: requestHeaders, body: { email: login, password } });
    } catch {
      return { error: "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa." };
    }
    redirect(account.user.role === "admin" ? "/admin" : "/affiliate");
  });
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/dang-nhap");
}

export async function changePassword(form: FormData): Promise<FormResult> {
  const user = await requireUser(undefined, true);
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  if (newPassword.length < 12 || newPassword.length > 128 || newPassword === currentPassword) {
    return { error: "Mật khẩu mới phải khác mật khẩu cũ và dài từ 12 đến 128 ký tự." };
  }
  if (newPassword !== form.get("confirmation")) return { error: "Hai mật khẩu mới chưa khớp." };
  try {
    await auth.api.changePassword({ headers: await headers(), body: { currentPassword, newPassword, revokeOtherSessions: true } });
  } catch {
    return { error: "Không đổi được mật khẩu. Kiểm tra mật khẩu hiện tại." };
  }
  if (user.mustChange) await db.user.update({ where: { id: user.id }, data: { mustChange: false } });
  redirect(user.role === "admin" ? "/admin" : "/affiliate");
}

export async function createAffiliate(form: FormData): Promise<FormResult> {
  await requireUser("admin");
  return runForm(async () => {
    const name = required(form, "name", "họ tên", 120);
    const contact = email(form, "email");
    const phone = normalizePhone(required(form, "phone", "số điện thoại", 32));
    if (!contact || !phone) return { error: "Nhập email và số điện thoại hợp lệ." };
    if (await db.user.findUnique({ where: { email: contact } })) return { error: "Email này đã có tài khoản." };
    const password = randomBytes(18).toString("base64url");
    const code = "CTV" + randomBytes(5).toString("hex").toUpperCase();
    await auth.api.createUser({ headers: await headers(), body: {
      email: contact, name, password, role: "affiliate",
      data: { phone, affiliateCode: code, mustChange: true },
    } });
    revalidatePath("/admin/affiliate");
    return { success: "Đã tạo " + code + ". Gửi mật khẩu tạm cho cộng tác viên qua kênh riêng.", secret: password };
  });
}

export async function toggleAffiliate(form: FormData): Promise<FormResult> {
  await requireUser("admin");
  return runForm(async () => {
    const user = await db.user.findFirst({ where: { id: String(form.get("id")), role: "affiliate" } });
    if (!user) return { error: "Không tìm thấy cộng tác viên." };
    if (user.banned) {
      await auth.api.unbanUser({ headers: await headers(), body: { userId: user.id } });
    } else {
      await auth.api.banUser({ headers: await headers(), body: { userId: user.id, banReason: "Quản trị viên khóa tài khoản" } });
    }
    revalidatePath("/admin/affiliate");
    return { success: user.banned ? "Đã mở lại tài khoản." : "Đã khóa tài khoản và thu hồi phiên đăng nhập." };
  });
}
