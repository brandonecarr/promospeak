import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { getAgencySubscription } from "@/server/queries/subscriptions";
import { listJobsForAgency } from "@/server/queries/jobs";
import { site } from "@/config/site";
import { SubscriptionBanner } from "@/components/agency/subscription-banner";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Agency overview" };

export default async function AgencyHome() {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) redirect(site.routes.home);

  const [sub, jobs] = await Promise.all([
    getAgencySubscription(agencyRow.agency.id),
    listJobsForAgency(agencyRow.agency.id),
  ]);

  const openJobs = jobs.filter((j) => j.status === "open");
  const draftJobs = jobs.filter((j) => j.status === "draft");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{agencyRow.agency.name}</h1>
        <p className="mt-1 text-muted-foreground">Activations at a glance.</p>
      </div>

      <SubscriptionBanner sub={sub} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open jobs" value={openJobs.length.toString()} />
        <Stat label="Drafts" value={draftJobs.length.toString()} />
        <Stat
          label="Plan"
          value={sub ? sub.planTier : "—"}
          extra={sub ? <Badge variant="outline" className="capitalize">{sub.status}</Badge> : null}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={site.routes.agency.jobsNew} className={buttonVariants()}>
          New job
        </Link>
        <Link href={site.routes.agency.jobs} className={buttonVariants({ variant: "outline" })}>
          All jobs
        </Link>
        <Link href={site.routes.agency.talent} className={buttonVariants({ variant: "outline" })}>
          Browse talent
        </Link>
        <Link href={site.routes.agency.messages} className={buttonVariants({ variant: "outline" })}>
          Messages
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-2xl font-semibold tracking-tight capitalize">{value}</p>
        {extra}
      </div>
    </div>
  );
}
