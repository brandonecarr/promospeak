import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { getJobByIdForAgency } from "@/server/queries/jobs";
import { transitionJobStatus } from "@/server/actions/jobs";
import { site } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobForm } from "@/components/agency/job-form";

export const metadata = { title: "Edit job" };

type Params = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: Params) {
  const { id } = await params;
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) {
    redirect(site.routes.home);
  }
  const job = await getJobByIdForAgency(id, agencyRow.agency.id);
  if (!job) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={site.routes.agency.jobs}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All jobs
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
            <Badge variant={job.status === "open" ? "default" : "outline"} className="capitalize">
              {job.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.status === "draft" ? (
            <form action={transitionJobStatus}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="open" />
              <Button type="submit">Publish</Button>
            </form>
          ) : null}
          {job.status === "open" ? (
            <>
              <Link
                href={`${site.routes.publicJobs}/${job.slug}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View public
              </Link>
              <form action={transitionJobStatus}>
                <input type="hidden" name="jobId" value={job.id} />
                <input type="hidden" name="action" value="close" />
                <Button type="submit" variant="outline" size="sm">
                  Close
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      <JobForm
        defaults={{
          id: job.id,
          title: job.title,
          description: job.description,
          roleType: job.roleType,
          city: job.city,
          state: job.state,
          venueName: job.venueName,
          startAt: job.startAt,
          endAt: job.endAt,
          payRateCents: job.payRateCents,
          payBasis: job.payBasis,
          dressCode: job.dressCode,
          requirements: job.requirements,
          headcountNeeded: job.headcountNeeded,
          requiresVerifiedId: job.requiresVerifiedId,
          requiresBackgroundCheck: job.requiresBackgroundCheck,
        }}
      />
    </div>
  );
}
