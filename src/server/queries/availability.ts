import "server-only";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type AvailabilityRow = typeof schema.availability.$inferSelect;

export async function listAvailability(ambassadorId: string): Promise<AvailabilityRow[]> {
  return db
    .select()
    .from(schema.availability)
    .where(eq(schema.availability.ambassadorId, ambassadorId))
    .orderBy(asc(schema.availability.kind), asc(schema.availability.weekday), asc(schema.availability.date));
}

export async function listUpcomingBookings(ambassadorId: string) {
  const now = new Date();
  return db
    .select({
      application: schema.applications,
      job: {
        id: schema.jobs.id,
        slug: schema.jobs.slug,
        title: schema.jobs.title,
        city: schema.jobs.city,
        state: schema.jobs.state,
        startAt: schema.jobs.startAt,
        endAt: schema.jobs.endAt,
        payRateCents: schema.jobs.payRateCents,
        payBasis: schema.jobs.payBasis,
      },
      agencyName: schema.agencies.name,
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.jobs.agencyId))
    .where(
      and(
        eq(schema.applications.ambassadorId, ambassadorId),
        inArray(schema.applications.status, ["confirmed", "offered"]),
        gte(schema.jobs.endAt, now),
      ),
    )
    .orderBy(desc(schema.jobs.startAt));
}
