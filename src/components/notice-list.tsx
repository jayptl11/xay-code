import Link from "next/link";
import { ActionForm } from "./form";
import { Card, Empty, Pill } from "./ui";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { readNotices } from "@/lib/settings-actions";

export async function NoticeList({ userId }: { userId: string | null }) {
  const rows = await db.notice.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 });
  return <Card title="Thông báo">
    {!rows.length ? <Empty>Chưa có thông báo.</Empty> : <div className="stack">
      {rows.map((n) => <div key={n.id} className="flex flex-wrap items-center gap-3">
        {!n.readAt && <Pill tone="green">Mới</Pill>}<Link href={n.href} className="text-link">{n.message}</Link><span className="muted text-sm">{date(n.createdAt)}</span>
      </div>)}
      {rows.some((n) => !n.readAt) && <ActionForm action={readNotices} quiet label="Đánh dấu đã đọc" />}
    </div>}
  </Card>;
}
