import { ActionForm } from "./form";
import { CheckField, Field, Input, Select, Textarea } from "./ui";
import { submitAffiliate, submitPublic } from "@/lib/request-actions";
import { OTHER_SERVICE } from "@/lib/services";

export function RequestForm({ affiliate = false, referral, title, services, selectedServiceId }: {
  affiliate?: boolean;
  referral?: string;
  title?: string;
  services: { id: string; title: string }[];
  selectedServiceId?: string;
}) {
  return <ActionForm action={affiliate ? submitAffiliate : submitPublic} label="Gửi yêu cầu" restartLabel="Gửi yêu cầu khác">
    <div className="fields">
      <Field label="Tên người liên hệ"><Input autoComplete="name" name="name" maxLength={120} required /></Field>
      <Field label="Công ty (nếu có)"><Input autoComplete="organization" name="company" maxLength={120} /></Field>
      <Field label="Số điện thoại / Zalo"><Input autoComplete="tel" type="tel" name="phone" placeholder="Ví dụ 09…" maxLength={32} /></Field>
      <Field label="Email"><Input name="email" type="email" autoComplete="email" maxLength={254} /></Field>
    </div>
    <p className="muted mb-4 text-sm">Điền ít nhất một cách để liên hệ.</p>
    <div className="fields">
      <Field label="Loại dự án"><Select name="category" required defaultValue={selectedServiceId ?? ""}><option value="" disabled>Chọn loại dự án</option>
        {services.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        <option value={OTHER_SERVICE}>Khác</option>
      </Select></Field>
      <Field label="Tên dự án (nếu có)"><Input name="title" maxLength={160} defaultValue={title} /></Field>
      <Field label="Thời gian mong muốn"><Input name="timeline" placeholder="Ví dụ trong 4 tuần" maxLength={120} /></Field>
      <Field label="Ngân sách dự kiến"><Input name="budget" placeholder="Ví dụ 5–8 triệu" maxLength={120} /></Field>
    </div>
    <Field label="Mô tả yêu cầu"><Textarea name="description" placeholder="Mục tiêu, người dùng và các chức năng chính…" required minLength={20} maxLength={5000} /></Field>
    <Field label="Liên kết tài liệu hoặc mẫu tham khảo"><Textarea name="links" placeholder="Mỗi liên kết một dòng" maxLength={1800} /></Field>
    {affiliate && <>
      <Field label="Giá đã trao đổi sơ bộ"><Input name="preliminary" maxLength={120} /></Field>
      <Field label="Ghi chú riêng cho quản trị viên"><Textarea name="submittedNote" maxLength={2000} /></Field>
    </>}
    {referral && <Field label="Mã người giới thiệu"><Input value={referral} readOnly /></Field>}
    <input name="website" className="trap" autoComplete="off" tabIndex={-1} aria-hidden />
    <CheckField name="consent" required label={affiliate ? "Khách đã đồng ý chia sẻ thông tin liên hệ để nhận báo giá." : "Tôi đồng ý cho lưu thông tin để được liên hệ về yêu cầu này."} />
  </ActionForm>;
}
