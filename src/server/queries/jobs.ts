import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type JobListItem = {
  id: string;
  slug: string;
  title: string;
  roleType: string;
  city: string;
  state: string;
  startAt: Date;
  endAt: Date;
  payRateCents: number;
  payBasis: "hour" | "flat" | "day";
  status: "draft" | "open" | "closed" | "cancelled" | "completed";
  featured: boolean;
  headcountNeeded: number;
  headcountFilled: number;
  agencyName: string;
  agencySlug: string;
  createdAt: Date;
};

const jobListSelect = {
  id: schema.jobs.id,
  slug: schema.jobs.slug,
  title: schema.jobs.title,
  roleType: schema.jobs.roleType,
  city: schema.jobs.city,
  state: schema.jobs.state,
  startAt: schema.jobs.startAt,
  endAt: schema.jobs.endAt,
  payRateCents: schema.jobs.payRateCents,
  payBasis: schema.jobs.payBasis,
  status: schema.jobs.status,
  featured: schema.jobs.featured,
  headcountNeeded: schema.jobs.headcountNeeded,
  headcountFilled: schema.jobs.headcountFilled,
  agencyName: schema.agencies.name,
  agencySlug: schema.agencies.slug,
  createdAt: schema.jobs.createdAt,
};

export async function listPublicJobs(opts?: { limit?: number; city?: string }) {
  const limit = opts?.limit ?? 50;
  const conditions = [eq(schema.jobs.status, "open")];
  if (opts?.city) {
    conditions.push(eq(schema.jobs.city, opts.city));
  }
  return db
    .select(jobListSelect)
    .from(schema.jobs)
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.jobs.agencyId))
    .where(and(...conditions))
    .orderBy(desc(schema.jobs.featured), desc(schema.jobs.startAt))
    .limit(limit);
}

export async function getPublicJobBySlug(slug: string) {
  const rows = await db
    .select({
      job: schema.jobs,
      agency: schema.agencies,
    })
    .from(schema.jobs)
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.jobs.agencyId))
    .where(and(eq(schema.jobs.slug, slug), eq(schema.jobs.status, "open")))
    .limit(1);
  return rows[0] ?? null;
}

export async function getJobByIdForAgency(jobId: string, agencyId: string) {
  const rows = await db
    .select()
    .from(schema.jobs)
    .where(and(eq(schema.jobs.id, jobId), eq(schema.jobs.agencyId, agencyId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listJobsForAgency(agencyId: string) {
  return db
    .select(jobListSelect)
    .from(schema.jobs)
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.jobs.agencyId))
    .where(eq(schema.jobs.agencyId, agencyId))
    .orderBy(desc(schema.jobs.createdAt));
}

export async function countActiveJobsForAgency(agencyId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.jobs)
    .where(and(eq(schema.jobs.agencyId, agencyId), eq(schema.jobs.status, "open")));
  return rows[0]?.count ?? 0;
}
