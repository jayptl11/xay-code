import Link from "next/link";
import { PageTitle } from "@/components/navigation";
import { Card, Empty, Pill, Select } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { code, date, requestLabels } from "@/lib/format";
import type { RequestStatus, RequestSource } from "@/generated/prisma/client";

export default async function Requests({ searchParams }: { searchParams: Promise<{ status?: string; source?: string; affiliate?: string }> }) {
  await requireUser("admin");
  const { status, source, affiliate } = await searchParams;
  const sources = { DIRECT: "Trực tiếp", LINK: "Link giới thiệu", AFFILIATE: "Affiliate gửi" };
  const rows = await db.projectRequest.findMany({
    where: {
      ...(status && Object.hasOwn(requestLabels, status) ? { status: status as RequestStatus } : {}),
      ...(source && Object.hasOwn(sources, source) ? { source: source as RequestSource } : {}),
      ...(typeof affiliate === "string" && affiliate ? { affiliate: { affiliateCode: affiliate } } : {}),
    }, orderBy: { createdAt: "desc" },
    include: { affiliate: { select: { name: true, affiliateCode: true } }, customer: { select: { _count: { select: { requests: true } } } } },
  });
  return <><PageTitle title="Yêu cầu & báo giá" subtitle="Xem yêu cầu mới, xác minh người giới thiệu và chốt phạm vi." />
    <Card>
      <form className="actions mb-4" method="get">
        <Select name="status" aria-label="Trạng thái" defaultValue={status ?? ""}><option value="">Mọi trạng thái</option>
          {Object.entries(requestLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
        <Select name="source" aria-label="Nguồn yêu cầu" defaultValue={source ?? ""}><option value="">Mọi nguồn</option>
          {Object.entries(sources).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
        <input className="control max-w-48" name="affiliate" aria-label="Mã affiliate" defaultValue={affiliate} placeholder="Mã affiliate" />
        <button className="button secondary">Lọc</button>
      </form>
      {!rows.length ? <Empty>Chưa có yêu cầu phù hợp.</Empty> : <div className="table-wrap"><table>
        <thead><tr><th>Yêu cầu</th><th>Khách hàng</th><th>Nguồn</th><th>Ngày nhận</th><th>Trạng thái</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>
          <td><Link className="text-link" href={"/admin/yeu-cau/" + r.id}>{r.title}</Link><br />{code("YC", r.number)}</td>
          <td>{r.name}{r.customer._count.requests > 1 && <><br /><Pill tone="orange">Trùng liên hệ</Pill></>}</td>
          <td>{sources[r.source]}{r.referralCode && <><br />{r.affiliate?.name ?? r.referralCode + " · Không hợp lệ"}</>}</td>
          <td>{date(r.createdAt)}</td><td><Pill>{requestLabels[r.status]}</Pill></td>
        </tr>)}</tbody>
      </table></div>}
    </Card></>;
}
