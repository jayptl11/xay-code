"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, Code2 } from "lucide-react";
import { useRef, useState } from "react";

const days = [
  { label: "Thứ hai", short: "T2", date: 23, closed: [1] },
  { label: "Thứ ba", short: "T3", date: 24, closed: [2] },
  { label: "Thứ tư", short: "T4", date: 25, closed: [0] },
  { label: "Thứ năm", short: "T5", date: 26, closed: [3] },
  { label: "Thứ sáu", short: "T6", date: 27, closed: [0, 3] },
] as const;
const slots = [["09:00", "09:30"], ["10:30", "11:00"], ["14:00", "14:30"], ["16:00", "16:30"]] as const;
const openSlots = days.reduce((total, day) => total + slots.length - day.closed.length, 0);

export function BookingPreview() {
  const [selection, setSelection] = useState({ day: 4, slot: 2 });
  const [review, setReview] = useState(false);
  const restoreFocus = useRef(false);
  const day = days[selection.day];
  const [time, end] = slots[selection.slot];
  const date = `${day.short} ${day.date}/11`;
  const backToSelection = () => {
    restoreFocus.current = true;
    setReview(false);
  };

  return <figure className="booking-preview" aria-label="Ví dụ giao diện đặt lịch dựng từ code" data-reveal>
    <div className="booking-stage">
      <div className="booking-editor" aria-hidden="true">
        <div className="booking-editor-tab"><i /><i /><i /><Code2 size={13} /> booking.ts <span>UTF-8 · DEMO</span></div>
        <pre><code>
          <span><b>const</b> booking = {"{"}</span>
          <span>{"  "}service: <i>{'"Tư vấn dự án"'}</i>,</span>
          <span>{"  "}duration: <em>30</em>,</span>
          <span>{"  "}date: <i>{`"2026-11-${day.date}"`}</i>,</span>
          <span>{"  "}time: <i>{JSON.stringify(time)}</i>,</span>
          <span>{"};"}</span>
        </code></pre>
        <div className="booking-editor-foot">▸ Đồng bộ với bản thử đặt lịch</div>
      </div>
      <div className="booking-float booking-order" aria-hidden="true"><b>+2 đơn mới</b> · Dữ liệu mẫu</div>
      <div className="booking-float booking-build" aria-hidden="true">▴ build ✓ <strong>demo</strong></div>
      <svg className="booking-stamp" viewBox="0 0 120 120" aria-hidden="true">
        <defs><path id="booking-stamp-ring" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" /></defs>
        <circle cx="60" cy="60" r="57" />
        <circle className="booking-stamp-dash" cx="60" cy="60" r="34" />
        <text><textPath href="#booking-stamp-ring" textLength="279">ĐẶT LỊCH TRAO ĐỔI · XÂY CODE · </textPath></text>
        <ArrowUpRight x={40} y={40} width={40} height={40} />
      </svg>
      <div className="booking-card" onKeyDown={(event) => {
        if (event.key === "Escape" && review) backToSelection();
      }}>
        <div className="booking-card-head"><span className="booking-calendar-icon"><CalendarDays size={21} aria-hidden /></span>
          <div><h2>Đặt lịch trao đổi</h2><p>Tư vấn 1-1 · 30 phút</p></div>
          <span className="booking-count" aria-label={review ? "Bước 2 trên 2" : "Bước 1 trên 2"}>{review ? "02/02" : "01/02"}</span>
        </div>
        {review ? <div className="booking-review" aria-live="polite">
          <div><p><Check size={18} aria-hidden /> Bạn đã chọn khung giờ</p><strong>{day.label}, {day.date}/11 · {time}–{end}</strong></div>
          <p>Đây là lịch minh họa. Để trao đổi thật, hãy gửi yêu cầu dự án.</p>
          <div className="booking-review-actions">
            <button type="button" className="booking-back" ref={(button) => { button?.focus({ preventScroll: true }); }} onClick={backToSelection}>Chọn lại</button>
            <Link href="/gui-yeu-cau">Gửi yêu cầu thật</Link>
          </div>
        </div> : <>
        <div className="booking-days" role="group" aria-label="Chọn ngày minh họa">
          {days.map((option, index) => {
            const closed: readonly number[] = option.closed;
            return <button key={option.date} type="button" className="booking-day"
              aria-label={`${option.label}, ngày ${option.date}`} aria-pressed={selection.day === index}
              onClick={() => { if (selection.day !== index) setSelection({ day: index, slot: slots.findIndex((_, i) => !closed.includes(i)) }); }}>
              <small>{option.short}</small><strong>{option.date}</strong>
            </button>;
          })}
        </div>
        <div className="booking-slot-heading"><span>Khung giờ · GMT+7</span><strong>{openSlots} trống / {days.length} ngày</strong></div>
        <div className="booking-slots" role="group" aria-label="Chọn giờ minh họa">
          {slots.map(([start, finish], index) => {
            const closed = (day.closed as readonly number[]).includes(index);
            return <button key={start} type="button" className="booking-slot" disabled={closed} aria-pressed={selection.slot === index}
              onClick={() => setSelection({ day: selection.day, slot: index })}>
              <span>{start}–{finish}</span>{closed && <small>Kín</small>}
            </button>;
          })}
        </div>
        <button className="booking-next" type="button" onClick={() => setReview(true)} ref={(button) => {
          if (button && restoreFocus.current) {
            button.focus({ preventScroll: true });
            restoreFocus.current = false;
          }
        }}>Tiếp tục · {date} · {time}</button>
        <p className="booking-note">Bản thử giao diện · Không tạo lịch thật</p>
        </>}
      </div>
    </div>
    <figcaption><span />Chọn ngày và giờ để xem code đổi theo</figcaption>
  </figure>;
}
