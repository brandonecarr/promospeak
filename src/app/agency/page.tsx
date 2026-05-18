import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { getAgencySubscription, type AgencySubscription } from "@/server/queries/subscriptions";
import { listJobsForAgency, type JobListItem } from "@/server/queries/jobs";
import { site } from "@/config/site";
import { SubscriptionBanner } from "@/components/agency/subscription-banner";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Agency overview" };

// TEMP DEBUG (revert after diagnosis).
function DebugError({ where, error }: { where: string; error: unknown }) {
  const e = error as { message?: string; code?: string; stack?: string; cause?: unknown };
  return (
    <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
      <strong>FAILED in: {where}</strong>
      {"\n"}message: {e?.message ?? String(error)}
      {e?.code ? `\ncode: ${e.code}` : ""}
      {e?.cause ? `\ncause: ${JSON.stringify(e.cause, null, 2)}` : ""}
      {e?.stack ? `\n\n${e.stack}` : ""}
    </pre>
  );
}

export default async function AgencyHome() {
  let user: Awaited<ReturnType<typeof requireRole>>["user"];
  try {
    ({ user } = await requireRole(["agency_member", "admin"]));
  } catch (err) {
    return <DebugError where="requireRole" error={err} />;
  }

  let agencyRow: Awaited<ReturnType<typeof getAgencyForUser>> | null = null;
  try {
    agencyRow = await getAgencyForUser(user.id);
  } catch (err) {
    return <DebugError where="getAgencyForUser" error={err} />;
  }
  if (!agencyRow) {
    return (
      <pre className="rounded-md border bg-muted/30 p-4 text-xs">
        DEBUG: no agency_members row for user id {user.id}.
      </pre>
    );
  }

  let sub: AgencySubscription = null;
  let jobs: JobListItem[] = [];
  try {
    [sub, jobs] = await Promise.all([
      getAgencySubscription(agencyRow.agency.id),
      listJobsForAgency(agencyRow.agency.id),
    ]);
  } catch (err) {
    return <DebugError where="getAgencySubscription/listJobsForAgency" error={err} />;
  }

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
