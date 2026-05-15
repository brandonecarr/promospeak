import { requireRole } from "@/lib/auth/roles";
import { listPublicJobs } from "@/server/queries/jobs";
import { site } from "@/config/site";
import { JobCard } from "@/components/jobs/job-card";

export const metadata = { title: "Find work" };

export default async function TalentJobsPage() {
  await requireRole(["ambassador", "admin"]);
  const jobs = await listPublicJobs({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Find work</h1>
        <p className="mt-1 text-muted-foreground">
          Browse open gigs. Click in to see the brief and apply.
        </p>
      </div>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No open gigs right now. Check back tomorrow — they post fast.
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} href={`${site.routes.publicJobs}/${job.slug}`} />
          ))
        )}
      </div>
    </div>
  );
}
