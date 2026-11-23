import Link from "next/link";
import { PageTitle } from "@/components/navigation";
import { Card, Empty, Pill } from "@/components/ui";
import { NoticeList } from "@/components/notice-list";
import { requireUser } from "@/lib/access";
import { projectDetails } from "@/lib/data";
import { db } from "@/lib/db";
import { clock, code, DAY, money, projectLabels, today } from "@/lib/format";
import { finance, maxZero, referralDeadline } from "@/lib/rules";

export default async function AdminHome() {
  await requireUser("admin");
  const [fresh, awaiting, projects, referrals, audit, sources] = await Promise.all([
    db.projectRequest.count({ where: { status: "NEW" } }),
    db.quote.count({ where: { status: "SENT", request: { status: "QUOTED" } } }),
    db.project.findMany({ include: projectDetails, orderBy: { createdAt: "desc" } }),
    db.projectRequest.findMany({ where: { affiliateId: { not: null }, status: { in: ["DISCUSSING", "QUOTED"] } } }),
    db.audit.findMany({ orderBy: { createdAt: "desc" }, take: 18 }),
    db.projectRequest.groupBy({ by: ["source", "status"], _count: { _all: true } }),
  ]);
  const active = projects.filter((p) => !["COMPLETE", "CANCELLED"].includes(p.status));
  const rows = projects.map((p) => ({ project: p, f: finance(p) }));
  const payable = rows.reduce((sum, r) => sum + (r.f.commission?.payable ?? 0n), 0n);
  const financeRows = rows.flatMap(({ project, f }) => {
    if (project.status === "CANCELLED") return [];
    const schedule = project.quote.schedule as { amount: string; due: string }[];
    const due = schedule.filter((line) => line.due < today()).reduce((sum, line) => sum + BigInt(line.amount), 0n);
    const overdue = maxZero(due - f.net);
    return overdue ? [{ project, overdue }] : [];
  });
  const currentMonth = today().slice(0, 7);
  const now = clock();
  const dueReferrals = referrals.filter((r) => {
    const left = +referralDeadline(r) - now;
    return left > 0 && left < DAY * 7;
  });
  const monthNet = projects.flatMap((p) => p.movements).filter((m) => !m.voidedAt && m.occurredOn.startsWith(currentMonth))
    .reduce((sum, m) => sum + (m.type === "RECEIPT" ? m.amount : -m.amount), 0n);
  return <div className="stack">
    <PageTitle title="Tổng quan" subtitle="Việc cần xử lý, tiến độ và dòng tiền." />
    <div className="grid-4">{[
      ["Yêu cầu mới", fresh, "/admin/yeu-cau"], ["Báo giá chờ phản hồi", awaiting, "/admin/yeu-cau"],
      ["Dự án đang theo dõi", active.length, "/admin/du-an"], ["Hoa hồng chờ trả", money(payable), "/admin/hoa-hong"],
    ].map(([label, val, href]) => <Card key={href + String(label)}><Link href={String(href)}><span className="muted">{label}</span><strong className="summary-number">{val}</strong></Link></Card>)}</div>
    <div className="grid-2">
      <Card title="Hạn dự án và các khoản thu">
        <p>Thực thu tháng này <strong>{money(monthNet)}</strong></p>
        <p>Còn phải thu <strong>{money(rows.filter(({ project }) => project.status !== "CANCELLED").reduce((sum, r) => sum + r.f.balance, 0n))}</strong></p>
        {financeRows.map(({ project, overdue }) => <p className="line" key={project.id}><Link className="text-link" href={"/admin/du-an/" + project.id}>{project.request.title}</Link> · Quá hạn {money(overdue)}</p>)}
        {active.filter((p) => p.quote.dueOn <= new Date(now + DAY * 7).toISOString().slice(0, 10)).map((p) =>
          <p className="line" key={p.id}><Link className="text-link" href={"/admin/du-an/" + p.id}>{p.request.title}</Link> · {p.quote.dueOn} <Pill>{projectLabels[p.status]}</Pill></p>)}
      </Card>
      <Card title="Yêu cầu sắp hết hạn ghi nhận">
        {!dueReferrals.length && <Empty>Không có yêu cầu sắp hết hạn trong 7 ngày tới.</Empty>}
        {dueReferrals.map((r) => <p key={r.id}><Link className="text-link" href={"/admin/yeu-cau/" + r.id}>{code("YC", r.number)} · {r.title}</Link></p>)}
      </Card>
    </div>
    <NoticeList userId={null} />
    <Card title="Yêu cầu theo nguồn"><div className="table-wrap"><table>
      <thead><tr><th>Nguồn</th><th>Yêu cầu</th><th>Đã thành dự án</th><th>Tỷ lệ chuyển đổi</th></tr></thead>
      <tbody>{([["DIRECT", "Trực tiếp"], ["LINK", "Link giới thiệu"], ["AFFILIATE", "Affiliate gửi"]] as const)
        .map(([source, label]) => {
          const entries = sources.filter((row) => row.source === source);
          const total = entries.reduce((sum, row) => sum + row._count._all, 0);
          const accepted = entries.find((row) => row.status === "ACCEPTED")?._count._all ?? 0;
          return <tr key={source}><td>{label}</td><td>{total}</td><td>{accepted}</td><td>{total ? Math.round(accepted * 100 / total) + "%" : "—"}</td></tr>;
        })}</tbody>
    </table></div></Card>
    <Card title="Nhật ký thay đổi">{audit.length ? audit.map((entry) => <p key={entry.id} className="line text-sm">
      {entry.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {entry.event} {entry.detail ? "· " + entry.detail : ""}
    </p>) : <Empty>Chưa có thay đổi.</Empty>}</Card>
  </div>;
}
