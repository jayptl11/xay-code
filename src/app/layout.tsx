import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Xây Code — Dịch vụ lập trình theo yêu cầu", template: "%s | Xây Code" },
  description: "Website, phần mềm quản lý, API và hỗ trợ phát triển dự án theo yêu cầu.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
