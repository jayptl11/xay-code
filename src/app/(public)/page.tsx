import Link from "next/link";
import { Braces, Globe2, Layers3, PanelsTopLeft, Plus, Server, Wrench } from "lucide-react";
import { BookingPreview } from "@/components/booking-preview";
import { HomeMotion, PublicProcess } from "@/components/public-interactions";
import { Empty } from "@/components/ui";
import { db } from "@/lib/db";
import { getPublishedServices } from "@/lib/services";

export const dynamic = "force-dynamic";

const serviceIcons = [PanelsTopLeft, Globe2, Layers3, Server, Wrench, Braces];
export default async function Home() {
  const [visibleServices, portfolio, settings] = await Promise.all([
    getPublishedServices(),
    process.env.DATABASE_URL ? db.content.findMany({
      where: { type: "PORTFOLIO", published: true, consent: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }) : [],
    process.env.DATABASE_URL ? db.settings.findUnique({ where: { id: 1 } }) : null,
  ]);
  return <HomeMotion>
      <section className="public-hero-frame"><div className="public-hero public-container">
          <div className="public-hero-copy">
            <h1><span className="hero-line"><span>Có ý tưởng?</span></span>{" "}
              <span className="hero-line"><span>Mình cùng <em>xây.</em></span></span>
            </h1>
            <p>Website, phần mềm quản lý và API theo nhu cầu của bạn. Trao đổi trực tiếp với người viết code, từ ý tưởng đầu tiên đến lúc bàn giao.</p>
            <div className="actions">
              <Link className="button primary" href="/gui-yeu-cau">Gửi yêu cầu dự án</Link>
              <Link className="button secondary" href="#dich-vu">Xem dịch vụ</Link>
            </div>
          </div>
          <BookingPreview />
      </div></section>
      <section className="public-container public-section public-service-section" id="dich-vu">
        <div className="public-section-heading public-rise" data-reveal>
          <h2>Bạn cần <em>xây gì?</em></h2>
          <p>Chọn hạng mục để xem chi tiết. Giá và tiến độ sẽ được báo riêng theo phạm vi.</p>
        </div>
        <ul className="public-services">
          {visibleServices.map((item, i) => {
            const Icon = serviceIcons[i % serviceIcons.length];
            return <li key={item.id} className="public-service public-rise" data-reveal style={{ animationDelay: `${(i % 3) * 70}ms` }}>
              <details name="public-services" open={i === 0}>
                <summary>
                  <span className="public-service-index" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <span className="public-service-icon"><Icon size={22} aria-hidden /></span>
                  <strong className="public-service-title">{item.title}</strong>
                  <span className="public-service-toggle" aria-hidden><Plus size={18} /></span>
                </summary>
                <div className="public-service-detail"><p className="multiline">{item.description}</p>
                  <Link className="button secondary" href={"/gui-yeu-cau?dichVu=" + encodeURIComponent(item.id)}>Trao đổi về hạng mục này</Link>
                </div>
              </details>
            </li>;
          })}
        </ul>
        {!visibleServices.length && <Empty>Danh sách dịch vụ đang được cập nhật.</Empty>}
      </section>
      <section className="public-project-band" id="du-an"><div className="public-container public-section">
        <div className="public-section-heading public-rise" data-reveal><h2>Dự án đã làm</h2></div>
        {!portfolio.length ? <div className="public-project-empty public-rise" data-reveal>
          <Empty>Danh mục sẽ được cập nhật khi các dự án được phép công bố.</Empty>
        </div> : <div className="grid-3 public-projects">
          {portfolio.map((item, i) => <article key={item.id} className="card public-rise" data-reveal style={{ animationDelay: `${(i % 3) * 70}ms` }}>
            {item.imageUrl && <div role="img" aria-label={item.title} className="portfolio-image" style={{ backgroundImage: "url(" + JSON.stringify(item.imageUrl) + ")" }} />}
            <h3>{item.title}</h3><p className="multiline">{item.description}</p>
            {item.stack && <p className="muted">{item.stack}</p>}
            <div className="actions mt-3">{item.demoUrl && <a className="text-link" target="_blank" rel="noreferrer" href={item.demoUrl}>Xem demo</a>}
              <Link className="text-link" href={"/gui-yeu-cau?mau=" + encodeURIComponent(item.title)}>Gửi yêu cầu tương tự</Link>
            </div>
          </article>)}
        </div>}
      </div></section>
      <PublicProcess description={settings?.process} />
      <section className="public-contact" id="lien-he"><div className="public-container public-contact-inner public-rise" data-reveal>
        <h2>Cùng nói về dự án của bạn.</h2>
        <div className="public-contact-actions">
          <Link className="button primary" href="/gui-yeu-cau">Gửi yêu cầu</Link>
          {settings?.contactEmail && <a href={"mailto:" + settings.contactEmail}>{settings.contactEmail}</a>}
          {settings?.zalo && <a href={settings.zalo} target="_blank" rel="noreferrer">Trao đổi qua Zalo</a>}
        </div>
      </div></section>
  </HomeMotion>;
}
