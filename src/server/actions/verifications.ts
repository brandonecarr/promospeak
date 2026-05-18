"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { checkr, CheckrError } from "@/lib/checkr/client";
import { requireRole } from "@/lib/auth/roles";
import {
  getAgencyForUser,
  getAmbassadorForUser,
  isAgencyOwnerOrAdmin,
} from "@/server/queries/profiles";
import { serverEnv } from "@/config/env";
import { site } from "@/config/site";

function originUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? site.url ?? "http://localhost:3000";
}

// Ambassador starts an ID verification via Stripe Identity.
export async function startIdentityVerification() {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);

  const session = await stripe().identity.verificationSessions.create({
    type: "document",
    metadata: { user_id: user.id, ambassador_id: ambassador.id },
    return_url: `${originUrl()}${site.routes.talent.verification}?status=submitted`,
  });

  await db.insert(schema.verifications).values({
    userId: user.id,
    kind: "id",
    provider: "stripe_identity",
    providerRef: session.id,
    status: "pending",
  });

  if (!session.url) {
    redirect(`${site.routes.talent.verification}?error=missing-url`);
  }
  redirect(session.url);
}

// Agency requests a background check on a finalist (shortlisted/offered ambassador).
const bgSchema = z.object({
  applicationId: z.uuid(),
});

export async function requestBackgroundCheck(formData: FormData) {
  const { user } = await requireRole(["agency_member", "admin"]);
  const parsed = bgSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) return;

  const rows = await db
    .select({
      application: schema.applications,
      ambassadorUserId: schema.ambassadors.userId,
      jobAgencyId: schema.jobs.agencyId,
      jobId: schema.jobs.id,
    })
    .from(schema.applications)
    .innerJoin(schema.ambassadors, eq(schema.ambassadors.id, schema.applications.ambassadorId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(eq(schema.applications.id, parsed.data.applicationId))
    .limit(1);
  const row = rows[0];
  if (!row) return;

  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow || agencyRow.agency.id !== row.jobAgencyId) return;
  if (!(await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id))) return;

  const candidateEmailRow = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, row.ambassadorUserId))
    .limit(1);
  const candidateEmail = candidateEmailRow[0]?.email;
  if (!candidateEmail) return;

  const env = serverEnv();
  if (!env.CHECKR_API_KEY) {
    redirect(
      `${site.routes.agency.jobs}/${row.jobId}/applicants?error=${encodeURIComponent(
        "Checkr not configured — set CHECKR_API_KEY.",
      )}`,
    );
  }

  try {
    const candidate = await checkr.candidates.create({
      email: candidateEmail,
      first_name: "Ambassador",
      last_name: "Pending",
    });
    const invitation = await checkr.invitations.create({
      candidate_id: (candidate as { id: string }).id,
      package: process.env.CHECKR_PACKAGE_SLUG ?? "tasker_standard",
    });
    await db.insert(schema.verifications).values({
      userId: row.ambassadorUserId,
      kind: "background",
      provider: "checkr",
      providerRef: (invitation as { id: string }).id,
      status: "pending",
      paidByAgencyId: agencyRow.agency.id,
      paidByJobId: row.jobId,
    });
    await db
      .update(schema.ambassadors)
      .set({ backgroundCheckStatus: "pending", updatedAt: new Date() })
      .where(eq(schema.ambassadors.userId, row.ambassadorUserId));
  } catch (err) {
    const msg = err instanceof CheckrError ? err.message : "Checkr request failed";
    redirect(
      `${site.routes.agency.jobs}/${row.jobId}/applicants?error=${encodeURIComponent(msg)}`,
    );
  }

  revalidatePath(`${site.routes.agency.jobs}/${row.jobId}/applicants`);
}
