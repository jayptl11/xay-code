export const DAY = 86_400_000;
export const REFERRAL_DAYS = 60;

export const requestLabels = {
  NEW: "Mới nhận", DISCUSSING: "Đang trao đổi", QUOTED: "Đã báo giá",
  ACCEPTED: "Đã nhận", CLOSED: "Không tiếp tục",
};

export const projectLabels = {
  DEPOSIT: "Chờ cọc", ACTIVE: "Đang làm", REVIEW: "Chờ khách phản hồi",
  DELIVERED: "Đã bàn giao", COMPLETE: "Hoàn thành", CANCELLED: "Đã hủy",
};

export const quoteLabels = {
  DRAFT: "Nháp", SENT: "Đã gửi", SUPERSEDED: "Đã thay thế", REJECTED: "Bị từ chối", ACCEPTED: "Đã xác nhận",
};

export const money = (value: number | bigint) => new Intl.NumberFormat("vi-VN").format(value) + " ₫";
export const percentage = (bps: number) => new Intl.NumberFormat("vi-VN").format(bps / 100) + "%";
export const code = (prefix: string, n: number) => prefix + "-" + String(n).padStart(prefix === "YC" ? 6 : 5, "0");
export const date = (value: Date | string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
export const dateTime = (value: Date) => new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
}).format(value);
export const today = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
export const clock = () => Date.now();
export const maskPhone = (value: string | null) => value ? value.slice(0, 4) + "•••" + value.slice(-3) : "—";
export const maskEmail = (value: string | null) => value ? value[0] + "•••@" + value.split("@")[1] : "—";

export function normalizePhone(value: string) {
  const clean = value.replace(/[\s.()-]/g, "").replace(/^\+84/, "0");
  return /^0\d{8,10}$/.test(clean) ? clean : null;
}
