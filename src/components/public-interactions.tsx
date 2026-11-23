"use client";

import Link from "next/link";
import { ClipboardList, FileText, Menu, PackageCheck, PanelsTopLeft, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const projectSteps = [
  { title: "Gửi yêu cầu", detail: "Kể về việc bạn đang cần giải quyết, các chức năng mong muốn và mốc thời gian.", output: "Thông tin để lên phạm vi", Icon: ClipboardList },
  { title: "Chốt báo giá", detail: "Thống nhất phần việc, chi phí, các đợt thanh toán và sản phẩm bàn giao.", output: "Báo giá theo phạm vi", Icon: FileText },
  { title: "Xem bản demo", detail: "Dùng thử và góp ý để mình chỉnh những điểm còn vướng trong phạm vi đã chốt.", output: "Bản chạy thử để bạn góp ý", Icon: PanelsTopLeft },
  { title: "Nghiệm thu", detail: "Kiểm tra lần cuối rồi nhận sản phẩm, mã nguồn và hướng dẫn theo báo giá.", output: "Sản phẩm và tài liệu bàn giao", Icon: PackageCheck },
];

export function PublicProcess({ description }: { description?: string | null }) {
  const list = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const steps = Array.from(list.current?.children ?? []);
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const readingLine = Math.min(140, Math.max(110, window.innerHeight * .25));
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const position = window.scrollY;
        let current = position >= maxScroll - 2 ? steps.length - 1 : 0;
        if (current === 0) {
          steps.forEach((step, index) => {
            if (step.getBoundingClientRect().top <= readingLine) current = index;
          });
        }
        // A link near the footer may reach the end before its card can reach the reading line.
        steps.forEach((step, index) => {
          if (`#${step.id}` !== window.location.hash) return;
          const margin = parseFloat(getComputedStyle(step).scrollMarginTop) || 0;
          const target = Math.min(maxScroll, position + step.getBoundingClientRect().top - margin);
          if (Math.abs(position - target) < 3) current = index;
        });
        setActive(current);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
  }, []);

  return <section className="public-container public-section public-process-section" id="quy-trinh">
    <div className="public-section-heading public-process-intro">
      <h2>Xây như <em>thế nào?</em></h2>
      <p className="multiline">{description?.trim() || "Từ yêu cầu đầu tiên đến bàn giao, mỗi bước đều có thứ cụ thể để bạn xem và góp ý."}</p>
      <div className="public-process-meter" aria-hidden><strong>{String(active + 1).padStart(2, "0")}</strong><span>/ {String(projectSteps.length).padStart(2, "0")}</span></div>
      <nav className="public-process-rail" aria-label="Các bước thực hiện">
        {projectSteps.map((step, i) => <a key={step.title} href={`#buoc-${i + 1}`} aria-current={active === i ? "step" : undefined}>
          <span aria-hidden>{String(i + 1).padStart(2, "0")}</span><span className="sr-only">{step.title}</span>
        </a>)}
      </nav>
    </div>
    <ol className="public-process" ref={list} data-reveal>
      {projectSteps.map(({ title, detail, output, Icon }, i) => <li key={title} id={`buoc-${i + 1}`} data-current={active === i}
        style={{ animationDelay: `${i * 95}ms` }}>
        <div className="public-process-step-head">
          <span className="public-process-node" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
          <h3>{title}</h3><span className="public-process-icon"><Icon size={21} aria-hidden /></span>
        </div>
        <p>{detail}</p><span className="public-process-output">{output}</span>
      </li>)}
    </ol>
  </section>;
}

export function MobilePublicMenu({ links }: { links: { href: string; label: string }[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const toggle = useRef<HTMLElement>(null);

  return <details className="public-mobile-menu" ref={menu} onKeyDown={(event) => {
    if (event.key !== "Escape" || !menu.current?.open) return;
    event.preventDefault();
    menu.current.open = false;
    toggle.current?.focus();
  }}>
    <summary ref={toggle}><Menu className="menu-open-icon" size={18} aria-hidden /><X className="menu-close-icon" size={18} aria-hidden />Menu</summary>
    <nav aria-label="Điều hướng điện thoại">
      {links.map(({ href, label }) => <Link key={href} href={href} onClick={() => {
        if (menu.current) menu.current.open = false;
        toggle.current?.focus({ preventScroll: true });
      }}>{label}</Link>)}
    </nav>
  </details>;
}

export function HomeMotion({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = main.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    let observer: IntersectionObserver | undefined;

    function sync() {
      observer?.disconnect();
      if (preference.matches) {
        targets.forEach((target) => { delete target.dataset.motion; });
        return;
      }
      observer = new IntersectionObserver((entries, activeObserver) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          (target as HTMLElement).dataset.motion = "shown";
          activeObserver.unobserve(target);
        }
      }, { threshold: 0 });
      for (const target of targets) {
        if (target.dataset.motion === "shown") continue;
        if (target.getBoundingClientRect().top >= window.innerHeight) target.dataset.motion = "waiting";
        observer.observe(target);
      }
    }

    sync();
    preference.addEventListener("change", sync);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", sync);
    };
  }, []);

  return <main ref={main} id="noi-dung" className="public-home">{children}</main>;
}
