import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, FileText, FolderKanban, LayoutDashboard, LogOut, Settings, Users, Wallet } from "lucide-react";
import { clsx } from "clsx";
import { signOut } from "@/lib/auth-actions";
import { MobilePublicMenu } from "./public-interactions";

const publicLinks = [
  { href: "/#dich-vu", label: "Dịch vụ" },
  { href: "/#du-an", label: "Dự án" },
  { href: "/#quy-trinh", label: "Quy trình" },
];

export function Logo() {
  return <Link href="/" className="brand" aria-label="Trang chủ Xây Code">
    <Image src="/icon.svg" alt="" width={56} height={48} unoptimized />
  </Link>;
}

export function PublicNav() {
  return <header className="public-header"><div className="public-container public-header-inner">
    <Logo />
    <nav className="public-desktop-nav" aria-label="Điều hướng chính">
      {publicLinks.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
    <div className="public-header-actions">
      <MobilePublicMenu links={publicLinks} />
      <Link className="button secondary public-login" href="/dang-nhap"><CircleUserRound size={17} aria-hidden />Đăng nhập</Link>
    </div>
  </div></header>;
}

const adminLinks = [
  ["/admin", "Tổng quan", LayoutDashboard], ["/admin/yeu-cau", "Yêu cầu", FileText],
  ["/admin/du-an", "Dự án", FolderKanban], ["/admin/affiliate", "Cộng tác viên", Users],
  ["/admin/hoa-hong", "Hoa hồng", Wallet], ["/admin/cai-dat", "Cài đặt", Settings],
] as const;

const affiliateLinks = [
  ["/affiliate", "Tổng quan", LayoutDashboard],
  ["/affiliate/gui-yeu-cau", "Gửi yêu cầu", FileText],
  ["/affiliate/tai-khoan", "Tài khoản", CircleUserRound],
] as const;

export function Portal({ role, name, children }: { role: "admin" | "affiliate"; name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const links = (role === "admin" ? adminLinks : affiliateLinks) as readonly (readonly [string, string, typeof LayoutDashboard])[];
  const isCurrent = (href: string) => href === "/" + role ? pathname === "/" + role : pathname.startsWith(href);
  return <div className="portal">
    <aside className="sidebar">
      <Logo />
      <span className="sidebar-label">{role === "admin" ? "Quản trị" : "Cổng cộng tác viên"}</span>
      <nav aria-label="Trang quản lý">{links.map(([href, label, Icon]) =>
        <Link key={href} href={href} className={clsx(isCurrent(href) && "active")} aria-current={isCurrent(href) ? "page" : undefined}>
          <Icon size={17} aria-hidden />{label}
        </Link>
      )}</nav>
      <div className="sidebar-account"><span>{name}</span><form action={signOut}><button title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={19} /></button></form></div>
    </aside>
    <main className="workspace" id="noi-dung">{children}</main>
  </div>;
}

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return <header className="page-title"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</header>;
}
