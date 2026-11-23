import { PageTitle } from "@/components/navigation";
import { ActionForm } from "@/components/form";
import { Card, Field, Input } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { changePassword, signOut } from "@/lib/auth-actions";

export default async function Password() {
  const user = await requireUser(undefined, true);
  return <main id="noi-dung" className="narrow login public-form-page">
    <PageTitle title="Đổi mật khẩu" subtitle={user.mustChange ? "Đặt mật khẩu riêng để kích hoạt tài khoản." : undefined} />
    <Card><ActionForm action={changePassword} label="Đổi mật khẩu">
      <Field label="Mật khẩu hiện tại"><Input name="currentPassword" type="password" autoComplete="current-password" required /></Field>
      <Field label="Mật khẩu mới (từ 12 ký tự)"><Input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field>
      <Field label="Nhập lại mật khẩu mới"><Input name="confirmation" type="password" autoComplete="new-password" required /></Field>
    </ActionForm><form action={signOut} className="mt-3"><button className="text-link">Đăng xuất</button></form></Card>
  </main>;
}
