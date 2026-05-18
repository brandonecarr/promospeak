import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicJobBySlug } from "@/server/queries/jobs";
import { getCurrentUser } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { findApplicationByJobAndAmbassador } from "@/server/queries/applications";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplyForm } from "@/components/jobs/apply-form";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const row = await getPublicJobBySlug(slug);
  if (!row) return { title: "Job" };
  return {
    title: row.job.title,
    description: row.job.description.slice(0, 160),
  };
}

export default async function PublicJobDetailPage({ params }: Params) {
  const { slug } = await params;
  const row = await getPublicJobBySlug(slug);
  if (!row) notFound();
  const { job, agency } = row;

  const user = await getCurrentUser();
  const role = (user?.user_metadata?.role ?? user?.app_metadata?.role) as
    | "ambassador"
    | "agency_member"
    | "admin"
    | undefined;
  let existingApplicationStatus: string | null = null;
  if (user && role === "ambassador") {
    const ambassador = await getAmbassadorForUser(user.id);
    if (ambassador) {
      const existing = await findApplicationByJobAndAmbassador(job.id, ambassador.id);
      existingApplicationStatus = existing?.status ?? null;
    }
  }

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <Link href={site.routes.publicJobs} className="text-sm text-muted-foreground hover:text-foreground">
        ← All jobs
      </Link>

      <header className="mt-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{agency.name}</p>
        <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {job.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{job.roleType}</Badge>
          <Badge variant="outline">
            {job.city}, {job.state}
          </Badge>
          {job.requiresVerifiedId ? <Badge variant="outline">Verified ID</Badge> : null}
          {job.requiresBackgroundCheck ? <Badge variant="outline">Background check</Badge> : null}
        </div>
      </header>

      <dl className="mt-8 grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3">
        <Stat label="When" value={formatRange(job.startAt, job.endAt)} />
        <Stat
          label="Pay"
          value={`${formatCents(job.payRateCents)}/${
            job.payBasis === "flat" ? "flat" : job.payBasis === "hour" ? "hr" : "day"
          }`}
        />
        <Stat label="Headcount" value={`${job.headcountFilled}/${job.headcountNeeded}`} />
      </dl>

      <section className="prose prose-neutral mt-10 max-w-none whitespace-pre-wrap text-base leading-relaxed">
        {job.description}
      </section>

      {job.requirements.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Requirements</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {job.requirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {job.dressCode ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Dress code</h2>
          <p className="mt-2 text-sm text-muted-foreground">{job.dressCode}</p>
        </section>
      ) : null}

      <ApplyPanel
        jobId={job.id}
        jobSlug={job.slug}
        user={user}
        role={role}
        existingStatus={existingApplicationStatus}
      />
    </article>
  );
}

function ApplyPanel({
  jobId,
  jobSlug,
  user,
  role,
  existingStatus,
}: {
  jobId: string;
  jobSlug: string;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  role: string | undefined;
  existingStatus: string | null;
}) {
  if (!user) {
    return (
      <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Apply through {brand.name} — free for {brand.copy.talentNounPlural}.
        </p>
        <Link
          href={`${site.routes.signup}?role=talent&next=${encodeURIComponent(
            `${site.routes.publicJobs}/${jobSlug}`,
          )}`}
          className={buttonVariants({ className: "mt-4" })}
        >
          Apply now
        </Link>
      </div>
    );
  }

  if (role !== "ambassador") {
    return (
      <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Only ambassador accounts can apply. Switch accounts or sign up as an ambassador to apply.
      </div>
    );
  }

  if (existingStatus) {
    return (
      <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">
          You&apos;ve already applied. Current status:{" "}
          <span className="capitalize">{existingStatus.replace("_", " ")}</span>
        </p>
        <Link
          href={site.routes.talent.applications}
          className={buttonVariants({ variant: "outline", className: "mt-4" })}
        >
          See all your applications
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Apply for this gig</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your profile goes with this application. Add a quick note to stand out.
      </p>
      <div className="mt-4">
        <ApplyForm jobId={jobId} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) {
    return `${dateFmt.format(start)} • ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
