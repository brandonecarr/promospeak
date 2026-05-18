import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { plans, type PlanTier } from "@/config/pricing";

export type AgencySubscription = {
  agencyId: string;
  planTier: PlanTier;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "paused";
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
  stripeSubscriptionId: string;
} | null;

export async function getAgencySubscription(agencyId: string): Promise<AgencySubscription> {
  const rows = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.agencyId, agencyId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    agencyId: row.agencyId,
    planTier: row.planTier,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    trialEndsAt: row.trialEndsAt,
    stripeSubscriptionId: row.stripeSubscriptionId,
  };
}

export function isSubscriptionActive(sub: AgencySubscription): boolean {
  if (!sub) return false;
  return ["trialing", "active"].includes(sub.status);
}

export function planFor(sub: AgencySubscription) {
  if (!sub) return null;
  return plans[sub.planTier];
}
