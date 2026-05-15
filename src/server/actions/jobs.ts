"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser, isAgencyOwnerOrAdmin } from "@/server/queries/profiles";
import { site } from "@/config/site";

export type JobFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

const PAY_BASIS_VALUES = ["hour", "flat", "day"] as const;
type JobStatus = "draft" | "open" | "closed" | "cancelled" | "completed";

const jobSchema = z
  .object({
    title: z.string().min(3, "Title is required.").max(200),
    description: z.string().min(20, "Describe the gig in at least 20 characters.").max(8000),
    roleType: z.string().min(2).max(80),
    city: z.string().min(2).max(120),
    state: z.string().min(2).max(80),
    venueName: z.string().max(200).optional(),
    startAt: z.iso.datetime({ offset: true }).or(z.string().min(1, "Start time required.")),
    endAt: z.iso.datetime({ offset: true }).or(z.string().min(1, "End time required.")),
    payRateCents: z.coerce.number().int().min(0).max(100000000),
    payBasis: z.enum(PAY_BASIS_VALUES),
    dressCode: z.string().max(500).optional(),
    requirements: z.string().max(1000).optional(),
    headcountNeeded: z.coerce.number().int().min(1).max(10000),
    requiresVerifiedId: z.boolean().optional(),
    requiresBackgroundCheck: z.boolean().optional(),
    intent: z.enum(["draft", "open"]),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: "End time must be after start time.",
    path: ["endAt"],
  });

export async function saveJob(
  _prevState: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) {
    return { status: "error", message: "No agency on file. Finish your agency setup first." };
  }
  if (!(await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id))) {
    return { status: "error", message: "Recruiters can't post jobs yet — ask an owner." };
  }

  const jobId = formData.get("jobId");

  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    roleType: formData.get("roleType"),
    city: formData.get("city"),
    state: formData.get("state"),
    venueName: formData.get("venueName") ?? "",
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    payRateCents: formData.get("payRateCents"),
    payBasis: formData.get("payBasis"),
    dressCode: formData.get("dressCode") ?? "",
    requirements: formData.get("requirements") ?? "",
    headcountNeeded: formData.get("headcountNeeded"),
    requiresVerifiedId: formData.get("requiresVerifiedId") === "on",
    requiresBackgroundCheck: formData.get("requiresBackgroundCheck") === "on",
    intent: formData.get("intent") ?? "draft",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const requirements = (data.requirements ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let newJobId: string | null = null;
  let newJobSlug: string | null = null;

  if (typeof jobId === "string" && jobId) {
    const existing = await db
      .select()
      .from(schema.jobs)
      .where(and(eq(schema.jobs.id, jobId), eq(schema.jobs.agencyId, agencyRow.agency.id)))
      .limit(1);
    if (!existing[0]) {
      return { status: "error", message: "Job not found." };
    }
    await db
      .update(schema.jobs)
      .set({
        title: data.title,
        description: data.description,
        roleType: data.roleType,
        city: data.city,
        state: data.state,
        venueName: data.venueName || null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        payRateCents: data.payRateCents,
        payBasis: data.payBasis,
        dressCode: data.dressCode || null,
        requirements,
        headcountNeeded: data.headcountNeeded,
        requiresVerifiedId: !!data.requiresVerifiedId,
        requiresBackgroundCheck: !!data.requiresBackgroundCheck,
        status: data.intent,
        updatedAt: new Date(),
      })
      .where(eq(schema.jobs.id, jobId));
    newJobId = jobId;
    newJobSlug = existing[0].slug;
  } else {
    const baseSlug = slugify(data.title);
    const slug = await uniqueJobSlug(baseSlug);
    const inserted = await db
      .insert(schema.jobs)
      .values({
        agencyId: agencyRow.agency.id,
        postedByUserId: user.id,
        title: data.title,
        slug,
        description: data.description,
        roleType: data.roleType,
        city: data.city,
        state: data.state,
        venueName: data.venueName || null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        payRateCents: data.payRateCents,
        payBasis: data.payBasis,
        dressCode: data.dressCode || null,
        requirements,
        headcountNeeded: data.headcountNeeded,
        requiresVerifiedId: !!data.requiresVerifiedId,
        requiresBackgroundCheck: !!data.requiresBackgroundCheck,
        status: data.intent,
      })
      .returning({ id: schema.jobs.id, slug: schema.jobs.slug });
    newJobId = inserted[0].id;
    newJobSlug = inserted[0].slug;
  }

  revalidatePath(site.routes.agency.jobs);
  if (data.intent === "open" && newJobSlug) {
    revalidatePath(`${site.routes.publicJobs}/${newJobSlug}`);
    revalidatePath(site.routes.publicJobs);
  }
  redirect(`${site.routes.agency.jobs}/${newJobId}`);
}

const STATUS_TRANSITIONS = {
  open: ["draft", "closed"],
  close: ["open"],
  cancel: ["draft", "open"],
} as const;

export async function transitionJobStatus(formData: FormData) {
  const { user } = await requireRole(["agency_member", "admin"]);
  const jobId = formData.get("jobId");
  const action = formData.get("action");
  if (typeof jobId !== "string" || typeof action !== "string") return;
  if (!(action in STATUS_TRANSITIONS)) return;

  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) return;
  if (!(await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id))) return;

  const allowedFrom = STATUS_TRANSITIONS[action as keyof typeof STATUS_TRANSITIONS];
  const nextStatus: JobStatus =
    action === "open" ? "open" : action === "close" ? "closed" : "cancelled";

  await db
    .update(schema.jobs)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(
      and(
        eq(schema.jobs.id, jobId),
        eq(schema.jobs.agencyId, agencyRow.agency.id),
        inArray(schema.jobs.status, allowedFrom as unknown as JobStatus[]),
      ),
    );

  revalidatePath(site.routes.agency.jobs);
  revalidatePath(`${site.routes.agency.jobs}/${jobId}`);
  revalidatePath(site.routes.publicJobs);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "job";
}

async function uniqueJobSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  while (true) {
    const existing = await db
      .select({ id: schema.jobs.id })
      .from(schema.jobs)
      .where(eq(schema.jobs.slug, candidate))
      .limit(1);
    if (!existing[0]) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
