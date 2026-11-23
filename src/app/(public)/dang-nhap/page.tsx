import { redirect } from "next/navigation";
import { PageTitle } from "@/components/navigation";
import { ActionForm } from "@/components/form";
import { Card, Field, Input } from "@/components/ui";
import { signIn } from "@/lib/auth-actions";
import { currentUser } from "@/lib/access";

export default async function Login() {
  const user = await currentUser();
  if (user) redirect(user.mustChange ? "/doi-mat-khau" : user.role === "admin" ? "/admin" : "/affiliate");
  return <main id="noi-dung" className="narrow login public-form-page"><PageTitle title="Đăng nhập" subtitle="Dành cho quản trị viên và cộng tác viên đã được cấp tài khoản." />
    <Card><ActionForm action={signIn} label="Đăng nhập">
      <Field label="Email"><Input type="email" name="email" autoComplete="username" required /></Field>
      <Field label="Mật khẩu"><Input type="password" name="password" autoComplete="current-password" required /></Field>
    </ActionForm></Card>
  </main>;
}
