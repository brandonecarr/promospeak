import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { getJobByIdForAgency } from "@/server/queries/jobs";
import { listApplicationsForJob } from "@/server/queries/applications";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { ApplicantRow } from "@/components/agency/applicant-row";

export const metadata = { title: "Applicants" };

type Params = { params: Promise<{ id: string }> };

export default async function ApplicantsPage({ params }: Params) {
  const { id } = await params;
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) redirect(site.routes.home);

  const job = await getJobByIdForAgency(id, agencyRow.agency.id);
  if (!job) notFound();

  const applicants = await listApplicationsForJob(job.id);

  const buckets = {
    open: applicants.filter((a) =>
      ["applied", "shortlisted", "offered"].includes(a.application.status),
    ),
    confirmed: applicants.filter((a) => a.application.status === "confirmed"),
    closed: applicants.filter((a) =>
      ["declined", "withdrawn", "completed", "no_show"].includes(a.application.status),
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`${site.routes.agency.jobs}/${job.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {job.title}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Applicants</h1>
          <Badge variant="outline">{applicants.length} total</Badge>
        </div>
        <p className="mt-1 text-muted-foreground">
          Shortlist, offer, confirm. Headcount filled: {job.headcountFilled}/{job.headcountNeeded}.
        </p>
      </div>

      {applicants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No applicants yet. Share this gig once it&apos;s open.
        </div>
      ) : (
        <div className="space-y-8">
          <Bucket title="In review" rows={buckets.open} />
          <Bucket title="Confirmed" rows={buckets.confirmed} />
          <Bucket title="Closed" rows={buckets.closed} />
        </div>
      )}
    </div>
  );
}

function Bucket({
  title,
  rows,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof listApplicationsForJob>>;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title} ({rows.length})
      </h2>
      {rows.map(({ application, ambassador }) => (
        <ApplicantRow
          key={application.id}
          application={{
            id: application.id,
            status: application.status,
            coverNote: application.coverNote,
            offeredPayCents: application.offeredPayCents,
            agencyNote: application.agencyNote,
          }}
          ambassador={ambassador}
        />
      ))}
    </section>
  );
}
