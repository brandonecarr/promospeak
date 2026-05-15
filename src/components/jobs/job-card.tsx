import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { JobListItem } from "@/server/queries/jobs";

function formatDateRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) {
    return `${dateFmt.format(start)} • ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)}–${dateFmt.format(end)}`;
}

function formatPay(cents: number, basis: "hour" | "flat" | "day"): string {
  const dollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
  return `${dollars}/${basis === "flat" ? "flat" : basis === "hour" ? "hr" : "day"}`;
}

export function JobCard({ job, href }: { job: JobListItem; href: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border bg-card p-5 transition hover:border-foreground/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {job.agencyName}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">{job.title}</h3>
        </div>
        {job.featured ? <Badge variant="default">Featured</Badge> : null}
        {job.status !== "open" ? (
          <Badge variant="outline" className="capitalize">
            {job.status}
          </Badge>
        ) : null}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground sm:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wider">Where</dt>
          <dd className="text-foreground">
            {job.city}, {job.state}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">When</dt>
          <dd className="text-foreground">{formatDateRange(job.startAt, job.endAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Pay</dt>
          <dd className="text-foreground">{formatPay(job.payRateCents, job.payBasis)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider">Role</dt>
          <dd className="text-foreground">{job.roleType}</dd>
        </div>
      </dl>
    </Link>
  );
}
