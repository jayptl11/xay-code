import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client";

const cache = globalThis as typeof globalThis & { xaymaDb?: PrismaClient };

export const db = cache.xaymaDb ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

if (process.env.NODE_ENV !== "production") cache.xaymaDb = db;

export class InputError extends Error {}

export async function transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : null;
      const conflict = (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") ||
        (error instanceof Error && error.name === "DriverAdapterError" && typeof cause === "object" &&
          cause !== null && "kind" in cause && cause.kind === "TransactionWriteConflict");
      if (!conflict) throw error;
      if (attempt >= 2) throw new InputError("Dữ liệu đang được cập nhật. Tải lại trang và thử lại.");
    }
  }
}

export function audit(tx: Prisma.TransactionClient, actorId: string, subjectId: string, event: string, detail?: string) {
  return tx.audit.create({ data: { actorId, subjectId, event, detail } });
}

export function notice(tx: Prisma.TransactionClient, userId: string | null, message: string, href: string) {
  return tx.notice.create({ data: { userId, message, href } });
}
