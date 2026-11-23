import Link from "next/link";
import { PageTitle } from "@/components/navigation";
import { RequestForm } from "@/components/request-form";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/access";
import { ensurePolicy } from "@/lib/data";
import { db } from "@/lib/db";
import { getPublishedServices } from "@/lib/services";

export default async function AffiliateSubmit() {
  const user = await requireUser("affiliate");
  const current = await ensurePolicy();
  const accepted = await db.policyAcceptance.findUnique({ where: { userId_version: { userId: user.id, version: current.version } } });
  const services = accepted ? await getPublishedServices() : [];
  return <><PageTitle title="Gửi yêu cầu cho khách" />
    <Card>{accepted ? <RequestForm affiliate services={services} referral={user.affiliateCode ?? undefined} />
      : <p>Đọc và đồng ý <Link className="text-link" href="/affiliate">chính sách cộng tác viên</Link> trước khi gửi.</p>}</Card>
  </>;
}
