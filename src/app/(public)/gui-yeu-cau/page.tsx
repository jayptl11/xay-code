import { cookies } from "next/headers";
import { PageTitle } from "@/components/navigation";
import { RequestForm } from "@/components/request-form";
import { Card } from "@/components/ui";
import { getPublishedServices } from "@/lib/services";

export default async function NewRequest({ searchParams }: { searchParams: Promise<{ mau?: string; dichVu?: string }> }) {
  const [{ mau, dichVu }, services, cookieStore] = await Promise.all([searchParams, getPublishedServices(), cookies()]);
  const serviceId = services.find((service) => service.id === dichVu)?.id;
  return <main id="noi-dung" className="narrow public-form-page"><PageTitle title="Gửi yêu cầu dự án" subtitle="Mô tả việc bạn cần làm để nhận tư vấn và báo giá." />
    <Card><RequestForm services={services} selectedServiceId={serviceId}
      referral={cookieStore.get("xayma_ref")?.value} title={typeof mau === "string" ? mau.slice(0, 160) : undefined} /></Card>
  </main>;
}
