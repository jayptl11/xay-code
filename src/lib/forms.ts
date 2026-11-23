import { z } from "zod";
import { InputError } from "./db";

export function value(form: FormData, name: string, max = 4000) {
  const text = String(form.get(name) ?? "").trim();
  if (text.length > max) throw new InputError("Nội dung quá dài (" + name + ").");
  return text;
}

export function required(form: FormData, name: string, label: string, max?: number) {
  const text = value(form, name, max);
  if (!text) throw new InputError("Nhập " + label + ".");
  return text;
}

export function email(form: FormData, name: string) {
  const text = value(form, name, 254).toLowerCase();
  if (text && !z.email().safeParse(text).success) throw new InputError("Email không hợp lệ.");
  return text || null;
}

export function amount(form: FormData, name: string, allowZero = false) {
  const text = value(form, name, 14);
  if (!/^\d{1,13}$/.test(text) || (!allowZero && BigInt(text) === 0n)) {
    throw new InputError("Nhập số tiền nguyên hợp lệ theo đồng Việt Nam.");
  }
  return BigInt(text);
}

export function day(form: FormData, name: string) {
  const text = value(form, name, 10);
  const parsed = new Date(text + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== text) {
    throw new InputError("Ngày không hợp lệ.");
  }
  return text;
}

export function vietnamTimestamp(form: FormData, name: string, lowerBound: Date, label: string, optional = false) {
  const text = value(form, name, 16);
  const now = new Date();
  if (optional && !text) return now;
  const offset = 7 * 3600_000;
  const parsed = new Date(text + ":00+07:00");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) || !Number.isFinite(+parsed) ||
      new Date(+parsed + offset).toISOString().slice(0, 16) !== text ||
      +parsed < Math.floor(+lowerBound / 60_000) * 60_000 || +parsed > +now) {
    throw new InputError(label + " (giờ Việt Nam).");
  }
  return new Date(Math.max(+parsed, +lowerBound));
}

export function httpUrl(text: string) {
  if (!text) return null;
  let parsed: URL;
  try { parsed = new URL(text); } catch { throw new InputError("Liên kết không hợp lệ."); }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new InputError("Dùng liên kết HTTP hoặc HTTPS.");
  return text;
}

export type FormResult = { error?: string; success?: string; secret?: string };
export type PaymentSchedule = { label: string; amount: string; due: string }[];
export type QuoteReview = {
  confirmation: string;
  version: number;
  price: string;
  affiliate: { name: string; deadline: string; rateBps: number; amount: string } | null;
  reason?: string;
};
export type QuoteResult = FormResult & { review?: QuoteReview };
