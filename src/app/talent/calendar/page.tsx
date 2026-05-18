import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { listAvailability, listUpcomingBookings } from "@/server/queries/availability";
import { removeAvailability } from "@/server/actions/availability";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddAvailabilityForm } from "@/components/talent/add-availability-form";

export const metadata = { title: "Calendar" };

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TalentCalendarPage() {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);

  const [availability, bookings] = await Promise.all([
    listAvailability(ambassador.id),
    listUpcomingBookings(ambassador.id),
  ]);

  const recurring = availability.filter((a) => a.kind === "recurring");
  const blocks = availability.filter((a) => a.kind === "block");
  const opens = availability.filter((a) => a.kind === "open");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-muted-foreground">
          Recurring weekly availability + one-off blocks/opens. Confirmed bookings show up here
          automatically.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Upcoming bookings ({bookings.length})
        </h2>
        {bookings.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Nothing on the books yet.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {bookings.map(({ application, job, agencyName }) => (
              <li key={application.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Link
                    href={`${site.routes.publicJobs}/${job.slug}`}
                    className="font-medium hover:underline"
                  >
                    {job.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {agencyName} • {job.city}, {job.state} • {formatRange(job.startAt, job.endAt)}
                  </p>
                </div>
                <Badge
                  variant={application.status === "confirmed" ? "default" : "outline"}
                  className="capitalize"
                >
                  {application.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Add availability
        </h2>
        <AddAvailabilityForm />
      </section>

      <Group
        title="Recurring weekly"
        empty="No recurring windows set."
        rows={recurring.map((r) => ({
          id: r.id,
          label: `${WEEKDAY[r.weekday ?? 0]} • ${r.startTime}–${r.endTime}`,
          note: r.note,
        }))}
      />
      <Group
        title="Opens (one-off dates you're available)"
        empty="No specific opens added."
        rows={opens.map((r) => ({
          id: r.id,
          label: `${r.date}${r.startTime ? ` • ${r.startTime}–${r.endTime ?? ""}` : ""}`,
          note: r.note,
        }))}
      />
      <Group
        title="Blocks (dates you're unavailable)"
        empty="No blocked dates."
        rows={blocks.map((r) => ({
          id: r.id,
          label: `${r.date}${r.startTime ? ` • ${r.startTime}–${r.endTime ?? ""}` : ""}`,
          note: r.note,
        }))}
      />
    </div>
  );
}

function Group({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { id: string; label: string; note: string | null }[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                <span className="font-medium">{r.label}</span>
                {r.note ? <span className="ml-2 text-muted-foreground">— {r.note}</span> : null}
              </div>
              <form action={removeAvailability}>
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
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
