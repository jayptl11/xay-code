import { DAY, REFERRAL_DAYS } from "./format";

export function referralDeadline(request: { createdAt: Date; extendedUntil: Date | null }) {
  return request.extendedUntil ?? new Date(+request.createdAt + REFERRAL_DAYS * DAY);
}

export function qualifyingReferral<T extends { createdAt: Date; extendedUntil: Date | null }>(
  oldest: T | null, acceptedAt: Date, hasProject: boolean,
): T | null {
  return oldest && !hasProject && +acceptedAt >= +oldest.createdAt && +acceptedAt <= +referralDeadline(oldest)
    ? oldest : null;
}

export const maxZero = (amount: bigint) => amount > 0n ? amount : 0n;
export const commissionAmount = (base: bigint, bps: number) => (base * BigInt(bps) + 5000n) / 10000n;

export type FinancialProject = {
  status: string;
  quote: { price: bigint };
  extras: { price: bigint; eligible: boolean; acceptedAt: Date | null }[];
  movements: { group: string; type: string; amount: bigint; voidedAt: Date | null }[];
  commission: null | {
    base: bigint;
    rateBps: number;
    holdReason: string | null;
    lines: { amount: bigint; payout: { voidedAt: Date | null } }[];
    adjustments: { reduction: bigint }[];
  };
};

export function finance(project: FinancialProject) {
  const extras = project.extras.filter((x) => x.acceptedAt);
  const total = project.quote.price + extras.reduce((sum, x) => sum + x.price, 0n);
  const active = project.movements.filter((x) => !x.voidedAt);
  const sum = (group: string, type: string) => active.reduce((a, x) =>
    x.group === group && x.type === type ? a + x.amount : a, 0n);
  const received = sum("DEVELOPMENT", "RECEIPT");
  const refunded = sum("DEVELOPMENT", "REFUND");
  const net = received - refunded;
  const balance = maxZero(total - net);
  const hosting = sum("HOSTING", "RECEIPT") - sum("HOSTING", "REFUND");
  const c = project.commission;
  let commission = null;
  if (c) {
    const base = c.base + extras.reduce((a, x) => x.eligible ? a + x.price : a, 0n);
    const reduction = c.adjustments.reduce((a, x) => a + x.reduction, 0n);
    const earned = maxZero(commissionAmount(base, c.rateBps) - reduction);
    const paid = c.lines.reduce((a, x) => x.payout.voidedAt ? a : a + x.amount, 0n);
    const remaining = maxZero(earned - paid);
    const payable = project.status === "COMPLETE" && balance === 0n && !c.holdReason ? remaining : 0n;
    const status = project.status === "CANCELLED" ? "Đã hủy"
      : c.holdReason ? "Tạm giữ"
      : payable > 0n ? "Đủ điều kiện trả"
      : remaining === 0n && paid > 0n ? "Đã trả"
      : "Dự kiến";
    commission = { base, earned, paid, remaining, payable, status, reduction };
  }
  return { total, received, refunded, net, balance, hosting, commission };
}
