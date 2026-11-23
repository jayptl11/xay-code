import { ActionForm } from "@/components/form";
import { PageTitle } from "@/components/navigation";
import { Card, CheckField, Field, Hidden, Input, Pill, Select, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { ensurePolicy } from "@/lib/data";
import { db } from "@/lib/db";
import { publishPolicy, saveContent, saveSettings } from "@/lib/settings-actions";
import type { Content } from "@/generated/prisma/client";

function ContentForm({ item }: { item?: Content }) {
  return <ActionForm action={saveContent} label={item ? "Lưu nội dung" : "Thêm nội dung"}>
    <Hidden data={{ id: item?.id ?? "" }} />
    <div className="fields">
      <Field label="Loại nội dung"><Select name="type" defaultValue={item?.type ?? "SERVICE"}><option value="SERVICE">Dịch vụ</option><option value="PORTFOLIO">Dự án đã làm</option></Select></Field>
      <Field label="Thứ tự hiển thị"><Input name="position" type="number" min="0" max="10000" defaultValue={item?.position ?? 0} /></Field>
    </div>
    <Field label="Tiêu đề"><Input name="title" maxLength={160} defaultValue={item?.title} required /></Field>
    <Field label="Mô tả"><Textarea name="description" defaultValue={item?.description} required /></Field>
    <div className="grid-3">
      <Field label="Công nghệ"><Input name="stack" defaultValue={item?.stack ?? ""} /></Field>
      <Field label="Link ảnh bìa"><Input name="imageUrl" type="url" defaultValue={item?.imageUrl ?? ""} /></Field>
      <Field label="Link demo"><Input name="demoUrl" type="url" defaultValue={item?.demoUrl ?? ""} /></Field>
    </div>
    <CheckField name="consent" defaultChecked={item?.consent} label="Khách đồng ý công bố (bắt buộc với dự án)" />
    <CheckField name="published" defaultChecked={item?.published} label="Hiển thị trên website" />
  </ActionForm>;
}

export default async function SettingsPage() {
  await requireUser("admin");
  const [settings, policy, content] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 } }), ensurePolicy(), db.content.findMany({ orderBy: { position: "asc" } }),
  ]);
  return <div className="stack"><PageTitle title="Cài đặt" subtitle="Chính sách affiliate, thông tin liên hệ và nội dung công khai." />
    <div className="grid-2">
      <Card title="Thông tin chung"><ActionForm action={saveSettings}>
        <Field label="Tỷ lệ hoa hồng mặc định (%)"><Input name="rate" inputMode="decimal"
          placeholder="Chưa đặt" defaultValue={settings?.commissionBps == null ? "" : settings.commissionBps / 100} /></Field>
        <p className="muted mb-3">Áp dụng cho dự án mới. Cửa sổ ghi nhận 60 ngày.</p>
        <Field label="Email công khai"><Input type="email" name="contactEmail" defaultValue={settings?.contactEmail ?? ""} /></Field>
        <Field label="Link Zalo"><Input type="url" name="zalo" defaultValue={settings?.zalo ?? ""} /></Field>
        <Field label="Thông tin quy trình bổ sung"><Textarea name="process" defaultValue={settings?.process ?? ""} /></Field>
      </ActionForm></Card>
      <Card title="Chính sách cộng tác viên"><Pill>Phiên bản {policy.version || "mẫu"}</Pill>
        <ActionForm action={publishPolicy} label="Công bố phiên bản mới" className="mt-3">
          <Field label="Nội dung chính sách"><Textarea name="body" className="min-h-48" defaultValue={policy.body} required /></Field>
        </ActionForm>
      </Card>
    </div>
    <Card title="Nội dung website">
      {content.map((item) => <details key={item.id} className="line">
        <summary>{item.title} · {item.published ? "Đang hiển thị" : "Đang ẩn"}</summary><ContentForm item={item} />
      </details>)}
      <details className="line"><summary>Thêm dịch vụ hoặc dự án mẫu</summary><ContentForm /></details>
    </Card>
  </div>;
}
