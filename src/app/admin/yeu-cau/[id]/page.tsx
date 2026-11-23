import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, CopyButton } from "@/components/form";
import { PaymentScheduleFields, QuoteConfirmation } from "@/components/quote-forms";
import { PageTitle } from "@/components/navigation";
import { Card, CheckField, Empty, Field, Hidden, Input, Pill, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { firstReferral } from "@/lib/data";
import { db } from "@/lib/db";
import { code, date, dateTime, money, quoteLabels, requestLabels, today } from "@/lib/format";
import type { PaymentSchedule } from "@/lib/forms";
import { manageQuote } from "@/lib/project-actions";
import { manageRequest } from "@/lib/request-actions";
import { referralDeadline } from "@/lib/rules";

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const { id } = await params;
  const r = await db.projectRequest.findUnique({ where: { id }, include: {
    quotes: { orderBy: { version: "desc" } }, project: true, affiliate: { select: { name: true } },
  } });
  if (!r) notFound();
  const [duplicates, candidate, priorProjects, companyMatches] = await Promise.all([
    db.projectRequest.findMany({ where: { customerId: r.customerId, id: { not: id } }, select: { id: true, number: true, title: true } }),
    firstReferral(db, r.customerId),
    db.project.count({ where: { customerId: r.customerId } }),
    r.company ? db.projectRequest.count({ where: { company: { equals: r.company, mode: "insensitive" }, customerId: { not: r.customerId } } }) : 0,
  ]);
  const closed = r.status === "CLOSED" || r.status === "ACCEPTED";
  const newest = r.quotes[0];
  return <div className="stack"><Link href="/admin/yeu-cau" className="text-link">Danh sách yêu cầu</Link>
    <PageTitle title={r.title} subtitle={code("YC", r.number) + " · " + r.category}><Pill>{requestLabels[r.status]}</Pill></PageTitle>
    {r.project && <Link className="text-link" href={"/admin/du-an/" + r.project.id}>Mở dự án {code("DA", r.project.number)}</Link>}
    <div className="grid-2">
      <Card title="Thông tin yêu cầu">
        <p><strong>{r.name}</strong> · {[r.company, r.phone, r.email].filter(Boolean).join(" · ")}</p>
        <p className="multiline line">{r.description}</p>
        {r.links && <p className="multiline line">{r.links}</p>}
        {r.budget && <p>Ngân sách: {r.budget}</p>}{r.timeline && <p>Thời gian: {r.timeline}</p>}
        {r.preliminary && <p>Giá sơ bộ: {r.preliminary}</p>}{r.submittedNote && <p>Ghi chú affiliate: {r.submittedNote}</p>}
        {r.closeReason && <p>Lý do đóng: {r.closeReason}</p>}
        <ActionForm action={manageRequest} quiet label="Lưu ghi chú" className="line">
          <Hidden data={{ id, operation: "note" }} />
          <Field label="Ghi chú trao đổi (nội bộ)"><Textarea name="internalNote" defaultValue={r.internalNote ?? ""} /></Field>
        </ActionForm>
      </Card>
      <Card title="Nguồn giới thiệu">
        <p>Yêu cầu này: {r.affiliate?.name ?? (r.referralCode ? r.referralCode + " · mã không hợp lệ" : "Trực tiếp")}</p>
        {candidate && <p>Giới thiệu đầu: {candidate.affiliate?.name} · đến {date(referralDeadline(candidate))}</p>}
        {priorProjects > 0 && <p>Khách đã có {priorProjects} dự án.</p>}
        {duplicates.map((d) => <p key={d.id}><Link className="text-link" href={"/admin/yeu-cau/" + d.id}>Trùng liên hệ: {code("YC", d.number)} · {d.title}</Link></p>)}
        {companyMatches > 0 && <p><Pill tone="orange">Có {companyMatches} yêu cầu cùng tên công ty</Pill></p>}
        {r.status === "NEW" && <ActionForm action={manageRequest} label="Bắt đầu trao đổi" className="line">
          <Hidden data={{ id, operation: "discuss" }} />
        </ActionForm>}
        {!closed && <details className="line"><summary>Đóng yêu cầu</summary><ActionForm action={manageRequest} quiet label="Đóng yêu cầu">
          <Hidden data={{ id, operation: "close" }} /><Field label="Lý do"><Input name="reason" required /></Field>
        </ActionForm></details>}
        {!closed && candidate?.id === id && !priorProjects && ["DISCUSSING", "QUOTED"].includes(r.status) &&
          <details className="line"><summary>Gia hạn ghi nhận</summary><ActionForm action={manageRequest} quiet>
            <Hidden data={{ id, operation: "extend" }} /><Field label="Hạn mới"><Input type="date" name="until" required /></Field>
            <Field label="Lý do"><Input name="reason" required /></Field>
          </ActionForm></details>}
      </Card>
    </div>
    <Card title="Các phiên bản báo giá">
      {!r.quotes.length && <Empty>Chưa có báo giá.</Empty>}
      {r.quotes.map((q) => {
        const schedule = q.schedule as PaymentSchedule;
        const share = [r.title, "Báo giá phiên bản " + q.version, "Phạm vi: " + q.scope,
          "Bàn giao: " + q.deliverables, "Giá phát triển: " + money(q.price),
          ...schedule.map((s) => s.label + ": " + money(BigInt(s.amount)) + " · " + date(s.due)),
          "Dự kiến: " + date(q.startsOn) + " đến " + date(q.dueOn), "Bảo hành: " + q.warranty, "Hosting: " + q.hosting,
          q.terms, q.allowEarlyDelivery ? "Có thỏa thuận bàn giao trước khi thu đủ." : null,
        ].filter(Boolean).join("\n");
        return <details key={q.id} className="line" open={q.id === newest?.id}>
          <summary>Phiên bản {q.version} · {money(q.price)} · {quoteLabels[q.status]}</summary>
          <div className="multiline">{share}</div>
          <div className="copy-row"><CopyButton text={share} /></div>
          {q.sentAt && <p className="line muted">Gửi lúc {dateTime(q.sentAt)} (giờ Việt Nam)</p>}
          {q.evidence && <p className="line multiline">Khách xác nhận {q.acceptedAt && dateTime(q.acceptedAt)} · {q.evidence}</p>}
          {!closed && q.status === "DRAFT" && <ActionForm action={manageQuote} label="Đánh dấu đã gửi" className="mt-3">
            <Hidden data={{ requestId: id, quoteId: q.id, operation: "send" }} />
            <Field label="Giờ gửi thực tế (giờ Việt Nam)"><Input type="datetime-local" name="sentAt" /></Field>
            <p className="muted mb-2">Để trống để ghi giờ hiện tại.</p>
          </ActionForm>}
          {!closed && q.status === "SENT" && <div className="grid-2 line">
            <QuoteConfirmation requestId={id} quoteId={q.id} />
            <ActionForm action={manageQuote} label="Khách từ chối báo giá" quiet>
              <Hidden data={{ requestId: id, quoteId: q.id, operation: "reject" }} />
            </ActionForm>
          </div>}
        </details>;
      })}
    </Card>
    {!closed && <Card title={newest ? "Lập phiên bản mới" : "Lập báo giá"}>
      <ActionForm key={newest?.id ?? id} action={manageQuote} label="Lưu bản nháp">
        <Hidden data={{ requestId: id, operation: "create" }} />
        <Field label="Phạm vi công việc"><Textarea name="scope" required defaultValue={newest?.scope ?? r.description} /></Field>
        <Field label="Sản phẩm bàn giao"><Textarea name="deliverables" required defaultValue={newest?.deliverables} /></Field>
        <div className="grid-3">
          <Field label="Giá phát triển (đồng)"><Input name="price" type="number" min="1" step="1" required defaultValue={newest?.price.toString()} /></Field>
          <Field label="Ngày bắt đầu"><Input name="startsOn" type="date" required defaultValue={newest?.startsOn ?? today()} /></Field>
          <Field label="Dự kiến bàn giao"><Input name="dueOn" type="date" required defaultValue={newest?.dueOn} /></Field>
        </div>
        <PaymentScheduleFields initial={newest?.schedule as PaymentSchedule | undefined} />
        <div className="fields">
          <Field label="Bảo hành"><Input name="warranty" required defaultValue={newest?.warranty} /></Field>
          <Field label="Hosting sau bàn giao"><Input name="hosting" required defaultValue={newest?.hosting} /></Field>
        </div>
        <Field label="Điều khoản riêng"><Textarea name="terms" defaultValue={newest?.terms ?? ""} /></Field>
        <CheckField name="allowEarlyDelivery" label="Có thỏa thuận bàn giao trước khi khách thu xếp thanh toán đủ" defaultChecked={newest?.allowEarlyDelivery} />
      </ActionForm>
    </Card>}
  </div>;
}
