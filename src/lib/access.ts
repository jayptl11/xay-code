import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";

export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  return user && !user.banned ? user : null;
}

export async function requireUser(role?: "admin" | "affiliate", allowTemporary = false) {
  const user = await currentUser();
  if (!user) redirect("/dang-nhap");
  if (role && user.role !== role) redirect(user.role === "admin" ? "/admin" : "/affiliate");
  if (user.mustChange && !allowTemporary) redirect("/doi-mat-khau");
  return user;
}
