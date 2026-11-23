import assert from "node:assert/strict";
import { test } from "node:test";
import { commissionAmount, finance, qualifyingReferral, type FinancialProject } from "../src/lib/rules";
import { DAY, normalizePhone } from "../src/lib/format";

test("60 ngày chỉ áp dụng cho dự án đầu, theo yêu cầu giới thiệu đầu", () => {
  const createdAt = new Date("2026-09-01T00:00:00Z");
  const original = { createdAt, extendedUntil: null };
  const limit = new Date(+createdAt + 60 * DAY);
  assert.equal(qualifyingReferral(original, limit, false), original);
  assert.equal(qualifyingReferral(original, new Date(+limit + 1), false), null);
  assert.equal(qualifyingReferral(original, createdAt, true), null);
  const extended = { createdAt, extendedUntil: new Date(+limit + DAY) };
  assert.equal(qualifyingReferral(extended, extended.extendedUntil, false), extended);
  assert.equal(normalizePhone("+84 (912) 345-678"), "0912345678");
});

test("chỉ trả khi hoàn thành và thu đủ tiền phát triển", () => {
  const p: FinancialProject = { status: "DELIVERED", quote: { price: 6_000_000n }, extras: [], movements: [
    { group: "DEVELOPMENT", type: "RECEIPT", amount: 2_000_000n, voidedAt: null },
    { group: "HOSTING", type: "RECEIPT", amount: 4_000_000n, voidedAt: null },
  ], commission: { base: 6_000_000n, rateBps: 1000, holdReason: null, lines: [], adjustments: [] } };
  assert.equal(finance(p).commission?.payable, 0n);
  p.status = "CANCELLED";
  assert.equal(finance(p).commission?.status, "Đã hủy");
  assert.equal(finance(p).commission?.payable, 0n);
  p.status = "COMPLETE";
  assert.equal(finance(p).balance, 4_000_000n);
  p.movements.push({ group: "DEVELOPMENT", type: "RECEIPT", amount: 4_000_000n, voidedAt: null });
  assert.equal(finance(p).commission?.payable, 600_000n);
  p.commission!.holdReason = "Chờ đối soát";
  assert.equal(finance(p).commission?.status, "Tạm giữ");
  p.movements.push({ group: "DEVELOPMENT", type: "REFUND", amount: 1_000_000n, voidedAt: null });
  p.commission!.holdReason = null;
  assert.equal(finance(p).commission?.status, "Dự kiến");
  p.status = "CANCELLED";
  assert.equal(finance(p).commission?.payable, 0n);
  assert.equal(finance(p).commission?.status, "Đã hủy");
});

test("giữ lịch sử đã trả, chỉ trả thêm phần phát sinh đủ điều kiện", () => {
  const p: FinancialProject = { status: "COMPLETE", quote: { price: 6_000_000n }, extras: [
    { price: 1_000_000n, eligible: true, acceptedAt: new Date() },
    { price: 2_000_000n, eligible: false, acceptedAt: new Date() },
    { price: 9_000_000n, eligible: true, acceptedAt: null },
  ], movements: [{ group: "DEVELOPMENT", type: "RECEIPT", amount: 9_000_000n, voidedAt: null }],
  commission: { base: 6_000_000n, rateBps: 1000, holdReason: null,
    lines: [{ amount: 600_000n, payout: { voidedAt: null } }], adjustments: [] } };
  assert.equal(finance(p).commission?.payable, 100_000n);
  assert.equal(finance(p).commission?.paid, 600_000n);
  p.commission!.adjustments.push({ reduction: 100_000n });
  assert.equal(finance(p).commission?.payable, 0n);
  assert.equal(finance(p).commission?.paid, 600_000n);
  assert.equal(commissionAmount(5n, 1_000), 1n);
});
