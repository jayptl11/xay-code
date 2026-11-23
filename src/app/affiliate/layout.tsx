import { Portal } from "@/components/navigation";
import { requireUser } from "@/lib/access";
import "../portal.css";

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("affiliate");
  return <Portal role="affiliate" name={user.name}>{children}</Portal>;
}
