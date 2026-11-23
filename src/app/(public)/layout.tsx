import Link from "next/link";
import { PublicNav } from "@/components/navigation";
import "@fontsource/anton/latin-400.css";
import "@fontsource/anton/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "./public.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-shell">
    <a href="#noi-dung" className="public-skip">Đến nội dung</a>
    <PublicNav />
    {children}
    <footer className="public-footer"><div className="public-container">
      <span className="public-footer-brand">Xây Code — dịch vụ lập trình theo yêu cầu</span>
      <Link href="/chinh-sach">Chính sách cộng tác viên</Link>
    </div></footer>
  </div>;
}
