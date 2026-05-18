import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { listApplicationsForAmbassador } from "@/server/queries/applications";
import { transitionApplication } from "@/server/actions/applications";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Your applications" };

const STATUS_COLOR: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  applied: "secondary",
  shortlisted: "default",
  offered: "default",
  confirmed: "default",
  declined: "outline",
  withdrawn: "outline",
  completed: "default",
  no_show: "destructive",
};

export default async function TalentApplicationsPage() {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);

  const rows = await listApplicationsForAmbassador(ambassador.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your applications</h1>
        <p className="mt-1 text-muted-foreground">
          Track who&apos;s reviewed you, who&apos;s offered, and what you&apos;ve confirmed.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t applied to anything yet.
          </p>
          <Link href={site.routes.talent.jobs} className={buttonVariants({ className: "mt-4" })}>
            Find work
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ application, job, agency }) => (
            <div key={application.id} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {agency.name}
                  </p>
                  <Link
                    href={`${site.routes.publicJobs}/${job.slug}`}
                    className="mt-0.5 inline-block text-lg font-semibold tracking-tight hover:underline"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {job.city}, {job.state} • {formatRange(job.startAt, job.endAt)}
                  </p>
                </div>
                <Badge
                  variant={STATUS_COLOR[application.status] ?? "outline"}
                  className="capitalize"
                >
                  {application.status.replace("_", " ")}
                </Badge>
              </div>

              {application.status === "offered" ? (
                <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
                  <p>
                    <span className="font-medium">Offer:</span>{" "}
                    {application.offeredPayCents !== null
                      ? `${formatCents(application.offeredPayCents)} ${payLabel(job.payBasis)}`
                      : `${formatCents(job.payRateCents)} ${payLabel(job.payBasis)}`}
                  </p>
                  {application.agencyNote ? (
                    <p className="mt-2 text-muted-foreground">{application.agencyNote}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <form action={transitionApplication}>
                      <input type="hidden" name="applicationId" value={application.id} />
                      <input type="hidden" name="action" value="confirm" />
                      <Button type="submit" size="sm">
                        Confirm
                      </Button>
                    </form>
                    <form action={transitionApplication}>
                      <input type="hidden" name="applicationId" value={application.id} />
                      <input type="hidden" name="action" value="decline_offer" />
                      <Button type="submit" size="sm" variant="outline">
                        Decline
                      </Button>
                    </form>
                  </div>
                </div>
              ) : null}

              {["applied", "shortlisted"].includes(application.status) ? (
                <form action={transitionApplication} className="mt-3">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <input type="hidden" name="action" value="withdraw" />
                  <Button type="submit" variant="ghost" size="sm">
                    Withdraw
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRange(start: Date, end: Date): string {
  const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${dateFmt.format(start)} • ${timeFmt.format(start)}–${timeFmt.format(end)}`
    : `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function payLabel(basis: "hour" | "flat" | "day"): string {
  return basis === "flat" ? "flat" : basis === "hour" ? "/hr" : "/day";
}
