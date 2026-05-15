import { site } from "@/config/site";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { requireRole } from "@/lib/auth/roles";

const navItems = [
  { href: site.routes.talent.root, label: "Overview" },
  { href: site.routes.talent.jobs, label: "Find work" },
  { href: site.routes.talent.applications, label: "Applications" },
  { href: site.routes.talent.calendar, label: "Calendar" },
  { href: site.routes.talent.messages, label: "Messages" },
  { href: site.routes.talent.portfolio, label: "Portfolio" },
  { href: site.routes.talent.verification, label: "Verification" },
  { href: site.routes.talent.profile, label: "Profile" },
  { href: site.routes.talent.settings, label: "Settings" },
];

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ambassador", "admin"]);
  return (
    <DashboardShell navItems={navItems} surfaceLabel="Ambassador">
      {children}
    </DashboardShell>
  );
}
