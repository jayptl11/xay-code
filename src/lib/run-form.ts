import { unstable_rethrow } from "next/navigation";
import { Prisma } from "../generated/prisma/client";
import { InputError } from "./db";
import type { FormResult } from "./forms";

export async function runForm<T extends FormResult>(operation: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await operation();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof InputError) return { error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      return { error: "Dữ liệu vừa được cập nhật hoặc bản ghi đã tồn tại. Tải lại trang và kiểm tra." };
    }
    if (error instanceof Error) console.error("Form action failed:", error.name, "code" in error ? error.code : "");
    return { error: "Không thể lưu lúc này. Kiểm tra lại rồi thử lại." };
  }
}
