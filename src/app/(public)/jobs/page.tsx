import { listPublicJobs } from "@/server/queries/jobs";
import { site } from "@/config/site";
import { JobCard } from "@/components/jobs/job-card";

export const metadata = {
  title: "Jobs",
  description:
    "Browse open promotional marketing gigs — sampling, demos, hosts, tours. Sign up free to apply.",
};

export const revalidate = 60;

export default async function PublicJobsPage() {
  const jobs = await listPublicJobs({ limit: 50 });
  return (
    <div className="container mx-auto px-4 py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="mb-3 inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Jobs
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Open gigs across the country.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Free to browse. Sign up as an ambassador to apply.
        </p>
      </header>

      <div className="mx-auto mt-12 max-w-4xl space-y-3">
        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No open jobs right now. Check back soon.
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
