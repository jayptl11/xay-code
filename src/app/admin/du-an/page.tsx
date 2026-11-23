import Link from "next/link";
import { PageTitle } from "@/components/navigation";
import { Card, Empty, Pill, Select } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { projectDetails } from "@/lib/data";
import { db } from "@/lib/db";
import { code, date, money, projectLabels, today } from "@/lib/format";
import { finance } from "@/lib/rules";
import type { ProjectStatus } from "@/generated/prisma/client";

export default async function Projects({ searchParams }: { searchParams: Promise<{ status?: string; due?: string }> }) {
  await requireUser("admin");
  const { status, due } = await searchParams;
  const projects = await db.project.findMany({
    where: {
      ...(status && Object.hasOwn(projectLabels, status) ? { status: status as ProjectStatus } : {}),
      ...(due === "late" ? { quote: { dueOn: { lt: today() } }, NOT: { status: { in: ["COMPLETE", "CANCELLED"] } } } : {}),
    }, include: projectDetails, orderBy: { createdAt: "desc" },
  });
  return <><PageTitle title="Dự án" subtitle="Quản lý công việc, bàn giao và thanh toán." />
    <Card><form className="actions mb-4" method="get">
      <Select name="status" aria-label="Trạng thái" defaultValue={status ?? ""}><option value="">Mọi trạng thái</option>{Object.entries(projectLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</Select>
      <Select name="due" aria-label="Hạn bàn giao" defaultValue={due ?? ""}><option value="">Mọi thời hạn</option><option value="late">Quá hạn</option></Select>
      <button className="button secondary">Lọc</button>
    </form>
    {!projects.length ? <Empty>Chưa có dự án phù hợp.</Empty> : <div className="table-wrap"><table>
      <thead><tr><th>Dự án</th><th>Khách</th><th>Hạn bàn giao</th><th>Trạng thái</th><th>Còn phải thu</th></tr></thead>
      <tbody>{projects.map((p) => <tr key={p.id}>
        <td><Link className="text-link" href={"/admin/du-an/" + p.id}>{p.request.title}</Link><br />{code("DA", p.number)}</td>
        <td>{p.request.name}</td><td>{date(p.quote.dueOn)}</td><td><Pill>{projectLabels[p.status]}</Pill></td>
        <td>{p.status === "CANCELLED" ? "—" : money(finance(p).balance)}</td>
      </tr>)}</tbody>
    </table></div>}</Card>
  </>;
}
