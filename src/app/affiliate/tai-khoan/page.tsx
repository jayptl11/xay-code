import Link from "next/link";
import { ActionForm } from "@/components/form";
import { PageTitle } from "@/components/navigation";
import { Card, Field, Input, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { saveAffiliateProfile } from "@/lib/settings-actions";

export default async function AffiliateAccount() {
  const user = await requireUser("affiliate");
  return <><PageTitle title="Tài khoản"><Link href="/doi-mat-khau" className="button secondary">Đổi mật khẩu</Link></PageTitle>
    <Card title="Thông tin cá nhân"><ActionForm action={saveAffiliateProfile}>
      <Field label="Họ tên"><Input name="name" defaultValue={user.name} required /></Field>
      <Field label="Email"><Input name="email" defaultValue={user.email} type="email" required /></Field>
      <Field label="Số điện thoại"><Input name="phone" defaultValue={user.phone ?? ""} type="tel" required /></Field>
      <p className="muted mb-2">Đang áp dụng: {user.bankDetails ?? "chưa có thông tin ngân hàng"}</p>
      {user.pendingBank && <p className="mb-2">Chờ duyệt: {user.pendingBank}</p>}
      <Field label="Đề nghị đổi thông tin ngân hàng"><Textarea name="bank" placeholder="Ngân hàng, số tài khoản, tên chủ tài khoản" /></Field>
    </ActionForm></Card>
  </>;
}
