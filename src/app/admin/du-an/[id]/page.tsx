import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/form";
import { PageTitle } from "@/components/navigation";
import { Card, CheckField, Empty, Field, Hidden, Input, Pill, Select, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { projectDetails } from "@/lib/data";
import { db } from "@/lib/db";
import { code, date, money, percentage, projectLabels, today } from "@/lib/format";
import { manageMoney, manageProject } from "@/lib/project-actions";
import { finance } from "@/lib/rules";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const { id } = await params;
  const p = await db.project.findUnique({ where: { id }, include: { ...projectDetails, tasks: { orderBy: { createdAt: "asc" } } } });
  if (!p) notFound();
  const f = finance(p);
  const statusActions = [
    p.status === "DEPOSIT" && ["start", "Bắt đầu làm", f.net <= 0n ? "Lý do bắt đầu khi chưa thu cọc" : ""],
    p.status === "ACTIVE" && ["review", "Chờ khách phản hồi", "Thông tin bản demo hoặc cập nhật đã gửi"],
    p.status === "REVIEW" && ["resume", "Quay lại đang làm", ""],
    ["ACTIVE", "REVIEW"].includes(p.status) && ["deliver", "Ghi đã bàn giao", "Thông tin bàn giao"],
    p.status === "DELIVERED" && ["complete", "Ghi hoàn thành", "Ngày và cách khách nghiệm thu"],
    !["COMPLETE", "CANCELLED"].includes(p.status) && ["cancel", "Hủy dự án", "Lý do hủy"],
  ].filter((item): item is string[] => !!item);
  return <div className="stack">
    <Link href="/admin/du-an" className="text-link">Danh sách dự án</Link>
    <PageTitle title={p.request.title} subtitle={code("DA", p.number) + " · " + p.request.name}>
      <Pill tone={p.status === "COMPLETE" ? "green" : "neutral"}>{projectLabels[p.status]}</Pill>
    </PageTitle>
    <div className="grid-4">{[
      ["Giá phát triển", f.total], ["Thực thu", f.net], ["Đã hoàn", f.refunded], ["Còn phải thu", f.balance],
    ].map(([label, value]) => <Card key={String(label)}><span className="muted">{label}</span><strong className="summary-number">{money(BigInt(value))}</strong></Card>)}</div>
    <div className="grid-2">
      <Card title="Phạm vi và tiến độ">
        <p><Link className="text-link" href={"/admin/yeu-cau/" + p.requestId}>Yêu cầu {code("YC", p.request.number)}</Link> · Hạn bàn giao {date(p.quote.dueOn)}</p>
        <p className="multiline line">{p.quote.scope}</p><p className="multiline">Bàn giao: {p.quote.deliverables}</p>
        {p.deliveryProof && <p className="line multiline">Đã bàn giao {p.deliveredAt && date(p.deliveredAt)} · {p.deliveryProof}</p>}
        {p.acceptanceProof && <p className="multiline">Nghiệm thu {p.completedAt && date(p.completedAt)} · {p.acceptanceProof}</p>}
        {p.cancellation && <p className="multiline">Lý do hủy: {p.cancellation}</p>}
        {statusActions.map(([operation, label, proof]) => <details key={operation} className="line"><summary>{label}</summary>
          <ActionForm action={manageProject} quiet label={label}><Hidden data={{ projectId: id, operation }} />
            {proof && <Field label={proof}><Textarea name="proof" required /></Field>}
          </ActionForm>
        </details>)}
      </Card>
      <Card title="Việc chính và tài liệu">
        {p.tasks.map((task) => <div key={task.id} className="line flex flex-wrap items-center justify-between gap-2">
          <span className={task.done ? "line-through muted" : ""}>{task.title}</span>
          {p.status !== "CANCELLED" && <ActionForm action={manageProject} label={task.done ? "Mở lại" : "Đánh dấu xong"} quiet>
            <Hidden data={{ projectId: id, operation: "toggle-task", taskId: task.id, next: String(!task.done) }} />
          </ActionForm>}
        </div>)}
        {p.status !== "CANCELLED" && <ActionForm action={manageProject} label="Thêm việc" quiet className="mt-3">
          <Hidden data={{ projectId: id, operation: "task" }} /><Field label="Tên công việc"><Input name="title" required maxLength={160} /></Field>
        </ActionForm>}
        <details className="line"><summary>Ghi chú và liên kết</summary>
          <ActionForm action={manageProject}><Hidden data={{ projectId: id, operation: "notes" }} />
            <Field label="Tài liệu"><Textarea name="documents" defaultValue={p.documents ?? ""} /></Field>
            <Field label="Link demo"><Input type="url" name="demo" defaultValue={p.demo ?? ""} /></Field>
            <Field label="Link mã nguồn"><Input type="url" name="repository" defaultValue={p.repository ?? ""} /></Field>
            <Field label="Ghi chú nội bộ"><Textarea name="internalNote" defaultValue={p.internalNote ?? ""} /></Field>
            <Field label="Ghi chú chia sẻ với affiliate"><Textarea name="sharedNote" defaultValue={p.sharedNote ?? ""} /></Field>
          </ActionForm>
        </details>
      </Card>
    </div>
    <Card title="Báo giá bổ sung">
      {p.extras.map((e) => <details className="line" key={e.id}>
        <summary>{money(e.price)} · {e.acceptedAt ? "Đã xác nhận" : "Chờ xác nhận"}{e.eligible ? " · Có tính hoa hồng" : ""}</summary>
        <p className="multiline">{e.scope}</p>
        {e.evidence && <p className="multiline">Xác nhận: {e.evidence}</p>}
        {!e.acceptedAt && p.status !== "CANCELLED" && <ActionForm action={manageProject} quiet label="Xác nhận phát sinh">
          <Hidden data={{ projectId: id, operation: "accept-extra", extraId: e.id }} />
          <Field label="Nội dung xác nhận của khách"><Input name="proof" required /></Field>
        </ActionForm>}
      </details>)}
      {p.status !== "CANCELLED" && <details className="line"><summary>Thêm báo giá bổ sung</summary><ActionForm action={manageProject} label="Lưu báo giá bổ sung">
        <Hidden data={{ projectId: id, operation: "extra" }} />
        <Field label="Nội dung phát sinh"><Textarea name="scope" required /></Field>
        <Field label="Giá phát sinh (đồng)"><Input type="number" name="price" min="1" step="1" required /></Field>
        {p.commission && <CheckField name="eligible" label="Tính thêm hoa hồng cho phần này" />}
      </ActionForm></details>}
    </Card>
    <Card title="Thu tiền và hoàn tiền">
      <p className="muted">Tổng đã thu cho phần phát triển {money(f.received)} · Thực thu hosting/bảo trì {money(f.hosting)}</p>
      <details className="line"><summary>Ghi khoản thu hoặc hoàn</summary><ActionForm action={manageMoney} label="Ghi giao dịch">
        <Hidden data={{ projectId: id }} />
        <div className="grid-3">
          <Field label="Loại giao dịch"><Select name="operation"><option value="receipt">Khoản thu</option><option value="refund">Hoàn tiền</option></Select></Field>
          <Field label="Nhóm"><Select name="group"><option value="DEVELOPMENT">Phát triển</option><option value="HOSTING">Hosting / bảo trì</option></Select></Field>
          <Field label="Số tiền (đồng)"><Input type="number" name="amount" min="1" step="1" required /></Field>
          <Field label="Ngày giao dịch"><Input type="date" name="occurredOn" defaultValue={today()} required /></Field>
          <Field label="Nội dung"><Input name="label" placeholder="Cọc, đợt giữa, còn lại…" required /></Field>
          <Field label="Chứng từ"><Input name="evidence" placeholder="Mã giao dịch hoặc link riêng" /></Field>
        </div>
        <Field label="Ghi chú / Lý do hoàn hoặc thu vượt"><Textarea name="note" /></Field>
      </ActionForm></details>
      {!p.movements.length ? <Empty>Chưa có giao dịch.</Empty> : <div className="table-wrap"><table>
        <thead><tr><th>Giao dịch</th><th>Ngày</th><th>Số tiền</th><th>Ghi chú</th><th>Trạng thái</th></tr></thead>
        <tbody>{p.movements.map((m) => <tr key={m.id}>
          <td>{m.label}<br />{m.type === "REFUND" ? "Hoàn tiền" : "Khoản thu"} · {m.group === "HOSTING" ? "Hosting / bảo trì" : "Phát triển"}</td>
          <td>{date(m.occurredOn)}</td><td>{money(m.amount)}</td><td className="multiline">{[m.note, m.evidence].filter(Boolean).join("\n")}</td>
          <td>{m.voidedAt ? "Đã hủy · " + m.voidReason : <details><summary>Hủy bản ghi</summary><ActionForm action={manageMoney} quiet label="Xác nhận hủy">
            <Hidden data={{ projectId: id, operation: "void", movementId: m.id }} />
            <Field label="Lý do hủy"><Input name="reason" required /></Field>
          </ActionForm></details>}</td>
        </tr>)}</tbody>
      </table></div>}
    </Card>
    <Card title="Hoa hồng">
      {p.commission && f.commission ? <>
        <p><strong>{p.commission.affiliate.name}</strong> · {percentage(p.commission.rateBps)} · <Pill>{f.commission.status}</Pill></p>
        <p>Giá tính hoa hồng {money(f.commission.base)} · Dự kiến {money(f.commission.earned)} · Đã trả {money(f.commission.paid)}</p>
        {p.commission.holdReason && <p>Lý do tạm giữ: {p.commission.holdReason}</p>}
        {p.commission.adjustments.map((a) => <p key={a.id}>Điều chỉnh {money(-a.reduction)} · {a.reason}</p>)}
        {f.commission.payable > 0n && <Link href="/admin/hoa-hong" className="text-link">Ghi nhận lần trả</Link>}
        {p.status !== "CANCELLED" && <details className="line"><summary>{p.commission.holdReason ? "Bỏ tạm giữ" : "Tạm giữ hoa hồng"}</summary>
          <ActionForm action={manageMoney}><Hidden data={{ projectId: id, operation: p.commission.holdReason ? "release" : "hold" }} />
            <Field label="Lý do"><Input name="reason" required /></Field>
          </ActionForm></details>}
        {f.commission.paid > 0n && <details className="line"><summary>Ghi khoản giảm đã đối soát</summary>
          <ActionForm action={manageMoney} label="Ghi điều chỉnh"><Hidden data={{ projectId: id, operation: "reduction" }} />
            <Field label="Số tiền giảm (đồng)"><Input name="amount" type="number" min="1" step="1" required /></Field>
            <Field label="Lý do và thỏa thuận"><Textarea name="reason" required /></Field>
          </ActionForm></details>}
      </> : <Empty>Dự án này không phát sinh hoa hồng.</Empty>}
    </Card>
  </div>;
}
