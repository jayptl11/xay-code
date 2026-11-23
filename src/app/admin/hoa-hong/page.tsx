import Link from "next/link";
import { ActionForm } from "@/components/form";
import { PageTitle } from "@/components/navigation";
import { Card, CheckField, Empty, Field, Hidden, Input, Pill } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { projectDetails } from "@/lib/data";
import { db } from "@/lib/db";
import { code, date, money, today } from "@/lib/format";
import { recordPayout, voidPayout } from "@/lib/project-actions";
import { finance } from "@/lib/rules";

export default async function Payouts() {
  await requireUser("admin");
  const [projects, payouts] = await Promise.all([
    db.project.findMany({ where: { commission: { isNot: null } }, include: { ...projectDetails, commission: {
      include: { ...projectDetails.commission.include, affiliate: { select: { id: true, name: true, bankDetails: true } } },
    } } }),
    db.payout.findMany({ include: { affiliate: { select: { name: true } }, lines: {
      include: { commission: { select: { project: { select: { number: true } } } } },
    } }, orderBy: { createdAt: "desc" } }),
  ]);
  const rows = projects.map((p) => ({ p, f: finance(p).commission! }));
  const payable = rows.filter(({ f }) => f.payable > 0n);
  const groups = Map.groupBy(payable, ({ p }) => p.commission!.affiliateId);
  return <div className="stack"><PageTitle title="Hoa hồng và lần trả" subtitle="Xác nhận sau khi bạn đã chuyển tiền." />
    {!groups.size && <Card title="Chờ trả"><Empty>Chưa có khoản đủ điều kiện.</Empty></Card>}
    {[...groups.entries()].map(([affiliateId, items]) => {
      const affiliate = items[0].p.commission!.affiliate;
      return <Card key={affiliateId} title={affiliate.name}>
        <ActionForm action={recordPayout} label="Ghi nhận đã chuyển">
          {items.map(({ p, f }) => <CheckField key={p.id} name="commission" value={p.commission!.id}
            label={code("DA", p.number) + " · " + p.request.title + " · " + money(f.payable)} />)}
          <div className="grid-3">
            <Field label="Ngày chuyển"><Input name="occurredOn" type="date" defaultValue={today()} required /></Field>
            <Field label="Số tiền đã chuyển (đồng)"><Input name="amount" type="number" min="1" step="1" required /></Field>
            <Field label="Mã giao dịch"><Input name="reference" required /></Field>
            <Field label="Người nhận và tài khoản"><Input name="recipient" required defaultValue={affiliate.bankDetails ?? affiliate.name} /></Field>
            <Field label="Chứng từ"><Input name="evidence" placeholder="Mã hoặc link chứng từ riêng" /></Field>
          </div>
        </ActionForm>
      </Card>;
    })}
    <Card title="Đang tạm giữ">
      {!rows.some(({ f }) => f.status === "Tạm giữ") && <Empty>Không có khoản tạm giữ.</Empty>}
      {rows.filter(({ f }) => f.status === "Tạm giữ").map(({ p }) => <p key={p.id}>
        <Link href={"/admin/du-an/" + p.id} className="text-link">{code("DA", p.number)}</Link> · {p.commission?.holdReason}
      </p>)}
    </Card>
    <Card title="Lịch sử lần trả">
      {!payouts.length ? <Empty>Chưa có lần trả.</Empty> : <div className="table-wrap"><table>
        <thead><tr><th>Affiliate</th><th>Lần trả</th><th>Dự án</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>{payouts.map((p) => <tr key={p.id}><td>{p.affiliate.name}</td><td>{date(p.occurredOn)} · {p.reference}<br />{p.recipient}{p.evidence && <p>{p.evidence}</p>}</td>
          <td>{p.lines.map((l) => code("DA", l.commission.project.number)).join(", ")}</td><td>{money(p.amount)}</td>
          <td>{p.voidedAt ? <><Pill tone="orange">Đã hủy bản ghi</Pill><br />{p.voidReason}</> : <details><summary>Hủy bản ghi nhập sai</summary>
            <ActionForm action={voidPayout} label="Hủy bản ghi" quiet><Hidden data={{ id: p.id }} /><Field label="Lý do"><Input name="reason" required /></Field></ActionForm>
          </details>}</td></tr>)}</tbody>
      </table></div>}
    </Card>
  </div>;
}
