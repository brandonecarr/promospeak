import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { listJobsForAgency } from "@/server/queries/jobs";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";

export const metadata = { title: "Agency jobs" };

export default async function AgencyJobsPage() {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) {
    redirect(site.routes.home);
  }
  const jobs = await listJobsForAgency(agencyRow.agency.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-muted-foreground">
            Drafts, open posts, and the activations you&apos;ve already run.
          </p>
        </div>
        <Link href={site.routes.agency.jobsNew} className={buttonVariants()}>
          New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-medium">Nothing posted yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your first job goes up in under a minute.
          </p>
          <Link
            href={site.routes.agency.jobsNew}
            className={buttonVariants({ className: "mt-4" })}
          >
            Post a job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} href={`${site.routes.agency.jobs}/${job.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
