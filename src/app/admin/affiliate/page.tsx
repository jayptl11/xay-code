import { ActionForm } from "@/components/form";
import { PageTitle } from "@/components/navigation";
import { Card, CheckField, Empty, Field, Hidden, Input, Pill } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { createAffiliate, toggleAffiliate } from "@/lib/auth-actions";
import { db } from "@/lib/db";
import { approveBank } from "@/lib/settings-actions";

export default async function Affiliates() {
  await requireUser("admin");
  const affiliates = await db.user.findMany({
    where: { role: "affiliate" }, orderBy: { createdAt: "desc" },
    include: { _count: { select: { requests: true, commissions: true } } },
  });
  return <div className="stack"><PageTitle title="Cộng tác viên" subtitle="Cấp tài khoản, quản lý mã giới thiệu và duyệt thông tin nhận tiền." />
    <Card title="Cấp tài khoản">
      <ActionForm action={createAffiliate} label="Tạo tài khoản">
        <div className="grid-3">
          <Field label="Họ và tên"><Input name="name" required maxLength={120} /></Field>
          <Field label="Email"><Input name="email" type="email" required maxLength={254} /></Field>
          <Field label="Số điện thoại"><Input name="phone" type="tel" required maxLength={32} /></Field>
        </div>
      </ActionForm>
    </Card>
    <Card title="Danh sách cộng tác viên">
      {!affiliates.length ? <Empty>Chưa có tài khoản cộng tác viên.</Empty> : <div className="table-wrap"><table>
        <thead><tr><th>Cộng tác viên</th><th>Mã</th><th>Yêu cầu / dự án</th><th>Tài khoản</th><th>Ngân hàng</th></tr></thead>
        <tbody>{affiliates.map((u) => <tr key={u.id}>
          <td><strong>{u.name}</strong><br />{u.email}<br />{u.phone}</td><td><code>{u.affiliateCode}</code></td>
          <td>{u._count.requests} / {u._count.commissions}</td>
          <td><Pill tone={u.banned ? "orange" : "green"}>{u.banned ? "Đã khóa" : u.mustChange ? "Chờ kích hoạt" : "Hoạt động"}</Pill>
            <ActionForm action={toggleAffiliate} label={u.banned ? "Mở khóa" : "Khóa tài khoản"} quiet className="mt-2"><Hidden data={{ id: u.id }} /></ActionForm></td>
          <td>{u.bankDetails ?? "Chưa có"}
            {u.pendingBank && <ActionForm action={approveBank} label="Xử lý thay đổi" quiet className="mt-2">
              <Hidden data={{ id: u.id }} /><p>{u.pendingBank}</p><CheckField name="approve" label="Đồng ý áp dụng thông tin mới" />
            </ActionForm>}</td>
        </tr>)}</tbody>
      </table></div>}
    </Card>
  </div>;
}
