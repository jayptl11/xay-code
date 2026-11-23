import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { REFERRAL_DAYS } from "@/lib/format";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const value = (await context.params).code.trim().toUpperCase().slice(0, 48);
  const response = NextResponse.redirect(new URL("/", process.env.BETTER_AUTH_URL ?? request.url));
  if (!/^[A-Z0-9_-]+$/.test(value)) return response;
  const existing = request.cookies.get("xayma_ref")?.value;
  if (existing) {
    const isValid = await db.user.findFirst({
      where: { affiliateCode: existing, role: "affiliate", OR: [{ banned: false }, { banned: null }] },
      select: { id: true },
    });
    if (isValid) return response;
  }
  response.cookies.set("xayma_ref", value, { httpOnly: true, sameSite: "lax", maxAge: REFERRAL_DAYS * 86400,
    secure: process.env.BETTER_AUTH_URL?.startsWith("https:") ?? false, path: "/" });
  return response;
}
