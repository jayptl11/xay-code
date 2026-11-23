import { Portal } from "@/components/navigation";
import { requireUser } from "@/lib/access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  return <Portal role="admin" name={user.name}>{children}</Portal>;
}
