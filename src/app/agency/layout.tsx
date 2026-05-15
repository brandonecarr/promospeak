import { site } from "@/config/site";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { requireRole } from "@/lib/auth/roles";

const navItems = [
  { href: site.routes.agency.root, label: "Overview" },
  { href: site.routes.agency.jobs, label: "Jobs" },
  { href: site.routes.agency.talent, label: "Talent pool" },
  { href: site.routes.agency.messages, label: "Messages" },
  { href: site.routes.agency.team, label: "Team" },
  { href: site.routes.agency.billing, label: "Billing" },
  { href: site.routes.agency.settings, label: "Settings" },
];

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["agency_member", "admin"]);
  return (
    <DashboardShell navItems={navItems} surfaceLabel="Agency">
      {children}
    </DashboardShell>
  );
}
