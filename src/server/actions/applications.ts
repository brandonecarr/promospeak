"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser, getAmbassadorForUser } from "@/server/queries/profiles";
import { findApplicationByJobAndAmbassador } from "@/server/queries/applications";
import type { ApplicationStatus } from "@/server/queries/applications";
import { site } from "@/config/site";

export type ApplyFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const applySchema = z.object({
  jobId: z.uuid(),
  coverNote: z.string().max(2000).optional(),
});

export async function applyToJob(
  _prevState: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) {
    return { status: "error", message: "Finish your ambassador profile first." };
  }

  const parsed = applySchema.safeParse({
    jobId: formData.get("jobId"),
    coverNote: formData.get("coverNote") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid application." };
  }

  const job = await db
    .select({ id: schema.jobs.id, status: schema.jobs.status, slug: schema.jobs.slug })
    .from(schema.jobs)
    .where(eq(schema.jobs.id, parsed.data.jobId))
    .limit(1);
  if (!job[0] || job[0].status !== "open") {
    return { status: "error", message: "This job isn't accepting applications." };
  }

  const existing = await findApplicationByJobAndAmbassador(parsed.data.jobId, ambassador.id);
  if (existing) {
    return { status: "error", message: "You've already applied to this gig." };
  }

  await db.insert(schema.applications).values({
    jobId: parsed.data.jobId,
    ambassadorId: ambassador.id,
    coverNote: parsed.data.coverNote || null,
    status: "applied",
  });

  revalidatePath(site.routes.talent.applications);
  revalidatePath(`${site.routes.publicJobs}/${job[0].slug}`);
  redirect(site.routes.talent.applications);
}

// ─── Agency-driven transitions ─────────────────────────────────────────────
const AGENCY_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  shortlist: ["applied"],
  offer: ["applied", "shortlisted"],
  decline: ["applied", "shortlisted", "offered"],
  reset: ["shortlisted", "offered"],
  complete: ["confirmed"],
  no_show: ["confirmed"],
};

const NEXT_STATUS: Record<string, ApplicationStatus> = {
  shortlist: "shortlisted",
  offer: "offered",
  decline: "declined",
  reset: "applied",
  complete: "completed",
  no_show: "no_show",
};

const transitionSchema = z.object({
  applicationId: z.uuid(),
  action: z.enum([
    "shortlist",
    "offer",
    "decline",
    "reset",
    "complete",
    "no_show",
    "withdraw",
    "confirm",
    "decline_offer",
  ]),
  offeredPayCents: z.coerce.number().int().min(0).max(100000000).optional(),
  agencyNote: z.string().max(2000).optional(),
});

export async function transitionApplication(formData: FormData) {
  const parsed = transitionSchema.safeParse({
    applicationId: formData.get("applicationId"),
    action: formData.get("action"),
    offeredPayCents: formData.get("offeredPayCents") || undefined,
    agencyNote: formData.get("agencyNote") || undefined,
  });
  if (!parsed.success) return;

  const application = await db
    .select({
      application: schema.applications,
      jobAgencyId: schema.jobs.agencyId,
      ambassadorUserId: schema.ambassadors.userId,
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.ambassadors, eq(schema.ambassadors.id, schema.applications.ambassadorId))
    .where(eq(schema.applications.id, parsed.data.applicationId))
    .limit(1);
  if (!application[0]) return;
  const current = application[0].application;

  // Ambassador-driven actions
  if (parsed.data.action === "withdraw") {
    const { user } = await requireRole(["ambassador", "admin"]);
    if (application[0].ambassadorUserId !== user.id) return;
    if (!["applied", "shortlisted", "offered"].includes(current.status)) return;
    await updateStatus(parsed.data.applicationId, "withdrawn");
    revalidatePath(site.routes.talent.applications);
    return;
  }
  if (parsed.data.action === "confirm") {
    const { user } = await requireRole(["ambassador", "admin"]);
    if (application[0].ambassadorUserId !== user.id) return;
    if (current.status !== "offered") return;
    await updateStatus(parsed.data.applicationId, "confirmed");
    revalidatePath(site.routes.talent.applications);
    return;
  }
  if (parsed.data.action === "decline_offer") {
    const { user } = await requireRole(["ambassador", "admin"]);
    if (application[0].ambassadorUserId !== user.id) return;
    if (current.status !== "offered") return;
    await updateStatus(parsed.data.applicationId, "declined");
    revalidatePath(site.routes.talent.applications);
    return;
  }

  // Agency-driven actions
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow || agencyRow.agency.id !== application[0].jobAgencyId) return;

  const allowedFrom = AGENCY_TRANSITIONS[parsed.data.action];
  if (!allowedFrom || !allowedFrom.includes(current.status as ApplicationStatus)) return;

  const next = NEXT_STATUS[parsed.data.action];
  const update: Partial<typeof schema.applications.$inferInsert> = {
    status: next,
    updatedAt: new Date(),
  };
  if (parsed.data.action === "offer" && parsed.data.offeredPayCents !== undefined) {
    update.offeredPayCents = parsed.data.offeredPayCents;
  }
  if (parsed.data.action === "offer" && parsed.data.agencyNote) {
    update.agencyNote = parsed.data.agencyNote;
  }

  await db
    .update(schema.applications)
    .set(update)
    .where(eq(schema.applications.id, parsed.data.applicationId));

  // Track headcount on the job when a confirm happens (no double-count even if reapplied).
  if (next === "completed") {
    await db
      .update(schema.jobs)
      .set({ updatedAt: new Date() })
      .where(eq(schema.jobs.id, current.jobId));
  }

  revalidatePath(`${site.routes.agency.jobs}/${current.jobId}/applicants`);
  revalidatePath(site.routes.talent.applications);
}

async function updateStatus(applicationId: string, next: ApplicationStatus) {
  await db
    .update(schema.applications)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(schema.applications.id, applicationId));
}

// Helper for agency confirmation triggered alongside offer accept — keep simple
// headcount sync (server-driven; not raced via SQL to keep this slice small).
export async function syncJobHeadcount(jobId: string) {
  const rows = await db
    .select({ id: schema.applications.id })
    .from(schema.applications)
    .where(and(eq(schema.applications.jobId, jobId), eq(schema.applications.status, "confirmed")));
  await db
    .update(schema.jobs)
    .set({ headcountFilled: rows.length, updatedAt: new Date() })
    .where(eq(schema.jobs.id, jobId));
}
