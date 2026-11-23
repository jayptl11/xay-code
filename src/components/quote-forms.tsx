"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { manageQuote } from "@/lib/project-actions";
import { money, percentage } from "@/lib/format";
import type { PaymentSchedule, QuoteResult } from "@/lib/forms";
import { Field, Input, Textarea } from "./ui";

export function PaymentScheduleFields({ initial }: { initial?: PaymentSchedule }) {
  const [rows, setRows] = useState(() =>
    (initial?.length ? initial : [{ label: "", amount: "", due: "" }]).map((row, id) => ({ ...row, id })));
  const nextId = useRef(rows.length);

  return <fieldset className="line min-w-0">
    <legend className="font-bold">Các đợt thanh toán</legend>
    {rows.map((row, i) => <div key={row.id} className="grid-3 items-end">
      <Field label={`Tên đợt ${i + 1}`}><Input name="scheduleLabel" defaultValue={row.label} maxLength={120} required /></Field>
      <Field label={`Số tiền đợt ${i + 1} (đồng)`}><Input type="number" name="scheduleAmount" min="1" step="1" defaultValue={row.amount} required /></Field>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1"><Field label={`Hạn đợt ${i + 1}`}><Input type="date" name="scheduleDue" defaultValue={row.due} required /></Field></div>
        {rows.length > 1 && <button type="button" className="button secondary compact mb-3" aria-label={`Bỏ đợt ${i + 1}`}
          onClick={() => setRows((items) => items.filter((item) => item.id !== row.id))}>Bỏ</button>}
      </div>
    </div>)}
    <button type="button" className="button secondary compact" onClick={() => {
      const id = nextId.current++;
      setRows((items) => [...items, { id, label: "", amount: "", due: "" }]);
    }}>Thêm đợt thanh toán</button>
  </fieldset>;
}

export function QuoteConfirmation({ requestId, quoteId }: { requestId: string; quoteId: string }) {
  const [result, dispatch, pending] = useActionState((_: QuoteResult, data: FormData) => manageQuote(data), {});
  const [dirty, setDirty] = useState(false);
  const [, startTransition] = useTransition();
  const review = dirty ? undefined : result.review;

  return <form onChange={() => setDirty(true)} onSubmit={(event) => {
    event.preventDefault();
    if (pending) return;
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget);
    const accept = button?.getAttribute("value") === "accept";
    if (accept && !review) return;
    data.set("requestId", requestId);
    data.set("quoteId", quoteId);
    data.set("operation", accept ? "accept" : "review");
    if (accept && review) data.set("confirmation", review.confirmation);
    setDirty(false);
    startTransition(() => dispatch(data));
  }}>
    <Field label="Ngày giờ khách xác nhận (giờ Việt Nam)"><Input type="datetime-local" name="acceptedAt" required /></Field>
    <Field label="Nội dung hoặc link xác nhận"><Textarea name="evidence" required /></Field>
    <button type="submit" value="review" className="button secondary" disabled={pending}>Xem lại trước khi chốt</button>
    {pending && <p role="status" className="muted mt-2">Đang kiểm tra báo giá…</p>}
    {result.error && <p role="alert" className="feedback error">{result.error}</p>}
    {result.success && <p role="status" className="feedback success">{result.success}</p>}
    {review && <div className="line" aria-label="Bản xem lại báo giá" role="region">
      <p><strong>Phiên bản {review.version}</strong> · Giá phát triển {money(BigInt(review.price))}</p>
      {review.affiliate ? <>
        <p>Affiliate: <strong>{review.affiliate.name}</strong> · Hạn {review.affiliate.deadline}</p>
        <p>Hoa hồng dự kiến: <strong>{money(BigInt(review.affiliate.amount))}</strong> ({percentage(review.affiliate.rateBps)})</p>
      </> : <p>Không có hoa hồng. {review.reason}</p>}
      <button type="submit" value="accept" className="button primary mt-3" disabled={pending}>Xác nhận và tạo dự án</button>
    </div>}
  </form>;
}
