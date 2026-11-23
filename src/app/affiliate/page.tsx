import Link from "next/link";
import { ActionForm, CopyButton } from "@/components/form";
import { PageTitle } from "@/components/navigation";
import { NoticeList } from "@/components/notice-list";
import { Card, Empty, Pill } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { ensurePolicy, projectDetails } from "@/lib/data";
import { db } from "@/lib/db";
import { code, date, maskEmail, maskPhone, money, percentage, projectLabels, requestLabels } from "@/lib/format";
import { acceptPolicy } from "@/lib/request-actions";
import { finance } from "@/lib/rules";

export default async function AffiliateHome() {
  const user = await requireUser("affiliate");
  const policy = await ensurePolicy();
  const [acceptance, requests, projects, payouts] = await Promise.all([
    db.policyAcceptance.findUnique({ where: { userId_version: { userId: user.id, version: policy.version } } }),
    db.projectRequest.findMany({ where: { affiliateId: user.id }, orderBy: { createdAt: "desc" }, select: {
      id: true, number: true, title: true, createdAt: true, status: true, closeReason: true, name: true, email: true, phone: true,
    } }),
    db.project.findMany({ where: { commission: { affiliateId: user.id } }, include: projectDetails, orderBy: { createdAt: "desc" } }),
    db.payout.findMany({ where: { affiliateId: user.id }, include: {
      lines: { include: { commission: { select: { project: { select: { number: true } } } } } },
    }, orderBy: { createdAt: "desc" } }),
  ]);
  const url = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/?ref=" + user.affiliateCode;
  const finances = projects.map((p) => finance(p).commission);
  const sums = [
    ["Dự kiến", finances.reduce((sum, f) => sum + (f?.status === "Dự kiến" ? f.remaining : 0n), 0n)],
    ["Đủ điều kiện trả", finances.reduce((sum, f) => sum + (f?.payable ?? 0n), 0n)],
    ["Đã nhận", payouts.filter((p) => !p.voidedAt).reduce((sum, p) => sum + p.amount, 0n)],
    ["Tạm giữ", finances.reduce((sum, f) => sum + (f?.status === "Tạm giữ" ? f.remaining : 0n), 0n)],
  ] as const;
  return <div className="stack">
    <PageTitle title={"Xin chào, " + user.name} subtitle="Theo dõi yêu cầu, dự án và hoa hồng của bạn.">
      <Link className="button primary" href="/affiliate/gui-yeu-cau">Gửi yêu cầu</Link>
    </PageTitle>
    <Card title="Link giới thiệu"><p className="muted">Chia sẻ link cho khách tự gửi yêu cầu.</p>
      <div className="copy-row"><code>{url}</code><CopyButton text={url} /></div>
    </Card>
    {!acceptance && <Card title="Đồng ý chính sách cộng tác viên"><p className="multiline mb-3">{policy.body}</p>
      <ActionForm action={acceptPolicy.bind(null, policy.version)} label="Đồng ý chính sách" />
    </Card>}
    <div className="grid-4">{sums.map(([label, total]) => <Card key={label}><span className="muted">{label}</span><strong className="summary-number">{money(total)}</strong></Card>)}</div>
    <Card title="Yêu cầu của tôi">{!requests.length ? <Empty>Chưa có yêu cầu được ghi nhận.</Empty> : <div className="table-wrap"><table>
      <thead><tr><th>Yêu cầu</th><th>Ngày gửi</th><th>Khách hàng</th><th>Trạng thái</th></tr></thead>
      <tbody>{requests.map((r) => <tr key={r.id}><td><strong>{r.title}</strong><br />{code("YC", r.number)}</td><td>{date(r.createdAt)}</td>
        <td>{r.name}<br />{maskPhone(r.phone)} · {maskEmail(r.email)}</td><td><Pill>{requestLabels[r.status]}</Pill>{r.status === "CLOSED" && r.closeReason && <p>{r.closeReason}</p>}</td></tr>)}</tbody>
    </table></div>}</Card>
    <Card title="Dự án và hoa hồng">{!projects.length ? <Empty>Chưa có dự án được ghi nhận cho bạn.</Empty> : <div className="stack">
      {projects.map((p, i) => <details className="line" key={p.id}><summary>{code("DA", p.number)} · {p.request.title} · {projectLabels[p.status]}</summary>
        <p>Khách hàng {p.request.name} · {maskPhone(p.request.phone)} · {maskEmail(p.request.email)}</p>
        <p>Giá phát triển {money(finance(p).total)} · Tỷ lệ {percentage(p.commission!.rateBps)}</p>
        <p>Hoa hồng {money(finances[i]!.earned)} · <Pill tone="green">{finances[i]!.status}</Pill></p>
        <p className="muted">{p.sharedNote || "Hoa hồng được trả khi khách đã nghiệm thu và thanh toán đủ."}</p>
        {p.commission?.adjustments.map((a) => <p key={a.id}>Điều chỉnh {money(-a.reduction)} · {a.reason}</p>)}
      </details>)}
    </div>}</Card>
    <Card title="Lịch sử nhận hoa hồng">{!payouts.length ? <Empty>Chưa có lần trả nào.</Empty> : <div className="table-wrap"><table>
      <thead><tr><th>Ngày</th><th>Giao dịch</th><th>Dự án</th><th>Số tiền</th></tr></thead><tbody>
        {payouts.map((p) => <tr key={p.id}><td>{date(p.occurredOn)}</td><td>{p.reference}{p.voidedAt && <p>Đã hủy · {p.voidReason}</p>}</td>
          <td>{p.lines.map((l) => code("DA", l.commission.project.number)).join(", ")}</td><td>{money(p.amount)}</td></tr>)}
      </tbody>
    </table></div>}</Card>
    <NoticeList userId={user.id} />
  </div>;
}
