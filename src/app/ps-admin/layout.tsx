import { site } from "@/config/site";
import { DashboardShell } from "@/components/shared/dashboard-shell";

const navItems = [
  { href: site.routes.admin.root, label: "Overview" },
  { href: site.routes.admin.users, label: "Users" },
  { href: site.routes.admin.verifications, label: "Verifications" },
  { href: site.routes.admin.forum, label: "Forum" },
  { href: site.routes.admin.disputes, label: "Disputes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={navItems} surfaceLabel="Admin">
      {children}
    </DashboardShell>
  );
}
