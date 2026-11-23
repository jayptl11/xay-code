import { PageTitle } from "@/components/navigation";
import { Card } from "@/components/ui";
import { ensurePolicy, initialPolicy } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PolicyPage() {
  const policy = process.env.DATABASE_URL ? await ensurePolicy() : { body: initialPolicy };
  return <main id="noi-dung" className="narrow public-form-page"><PageTitle title="Chính sách cộng tác viên" />
    <Card><p className="multiline">{policy.body}</p></Card></main>;
}
