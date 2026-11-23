import { db } from "./db";
import type { Prisma } from "../generated/prisma/client";

export const projectDetails = {
  quote: true,
  request: true,
  extras: { orderBy: { createdAt: "desc" } },
  movements: { orderBy: { createdAt: "desc" } },
  commission: {
    include: {
      affiliate: { select: { name: true, affiliateCode: true } },
      adjustments: { orderBy: { createdAt: "desc" } },
      lines: { include: { payout: true } },
    },
  },
} as const satisfies Prisma.ProjectInclude;

export function firstReferral(tx: Prisma.TransactionClient, customerId: string) {
  return tx.projectRequest.findFirst({
    where: { customerId, affiliateId: { not: null } },
    orderBy: [{ createdAt: "asc" }, { number: "asc" }],
    include: { affiliate: { select: { name: true, affiliateCode: true } } },
  });
}

export const initialPolicy = "Cộng tác viên giới thiệu khách và có thể gửi yêu cầu thay khi khách đồng ý. Chủ dự án chịu trách nhiệm báo giá. Hoa hồng theo tỷ lệ chốt cho dự án đầu của khách trong cửa sổ ghi nhận 60 ngày, chỉ được trả khi dự án hoàn thành và thu đủ. Giữ kín thông tin khách hàng. Dịch vụ hỗ trợ học tập gồm hướng dẫn và review code.";

export function ensurePolicy() {
  return db.policy.findFirst({ orderBy: { version: "desc" } }).then((policy) => policy ??
    db.policy.upsert({ where: { version: 0 }, create: { version: 0, body: initialPolicy }, update: {} }));
}
