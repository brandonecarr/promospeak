import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "offered"
  | "confirmed"
  | "declined"
  | "withdrawn"
  | "completed"
  | "no_show";

export async function listApplicationsForJob(jobId: string) {
  return db
    .select({
      application: schema.applications,
      ambassador: {
        id: schema.ambassadors.id,
        userId: schema.ambassadors.userId,
        displayName: schema.ambassadors.displayName,
        slug: schema.ambassadors.slug,
        headline: schema.ambassadors.headline,
        city: schema.ambassadors.city,
        state: schema.ambassadors.state,
        languages: schema.ambassadors.languages,
        skills: schema.ambassadors.skills,
        verifiedIdAt: schema.ambassadors.verifiedIdAt,
        backgroundCheckStatus: schema.ambassadors.backgroundCheckStatus,
      },
    })
    .from(schema.applications)
    .innerJoin(schema.ambassadors, eq(schema.ambassadors.id, schema.applications.ambassadorId))
    .where(eq(schema.applications.jobId, jobId))
    .orderBy(desc(schema.applications.createdAt));
}

export async function listApplicationsForAmbassador(ambassadorId: string) {
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
        status: schema.jobs.status,
      },
      agency: {
        name: schema.agencies.name,
        slug: schema.agencies.slug,
      },
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.jobs.agencyId))
    .where(eq(schema.applications.ambassadorId, ambassadorId))
    .orderBy(desc(schema.applications.createdAt));
}

export async function getApplicationById(applicationId: string) {
  const rows = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.id, applicationId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findApplicationByJobAndAmbassador(
  jobId: string,
  ambassadorId: string,
) {
  const rows = await db
    .select()
    .from(schema.applications)
    .where(
      and(
        eq(schema.applications.jobId, jobId),
        eq(schema.applications.ambassadorId, ambassadorId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
