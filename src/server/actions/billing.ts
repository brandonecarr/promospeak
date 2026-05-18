"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser, isAgencyOwnerOrAdmin } from "@/server/queries/profiles";
import { plans, type PlanTier } from "@/config/pricing";
import { serverEnv } from "@/config/env";
import { site } from "@/config/site";

export type BillingError = { status: "error"; message: string };

function originUrl(): string {
  const env = serverEnv();
  // Fall back to NEXT_PUBLIC_SITE_URL or the configured site.url.
  return process.env.NEXT_PUBLIC_SITE_URL ?? site.url ?? `https://${env.NODE_ENV}`;
}

export async function startCheckout(formData: FormData) {
  const { user } = await requireRole(["agency_member", "admin"]);
  const tier = formData.get("tier") as PlanTier | null;
  const billingCycle = (formData.get("cycle") as "monthly" | "annual" | null) ?? "monthly";
  if (!tier || !(tier in plans)) return;

  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) return;
  if (!(await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id))) return;

  const plan = plans[tier];
  if (plan.monthlyPriceCents === 0) {
    // Enterprise — route through contact instead of checkout.
    redirect(site.routes.contact);
  }

  const priceIdKey = billingCycle === "annual" ? plan.stripeAnnualPriceIdEnvKey : plan.stripeMonthlyPriceIdEnvKey;
  const priceId = process.env[priceIdKey];
  if (!priceId) {
    redirect(`${site.routes.agency.billing}?error=${encodeURIComponent(
      `Missing Stripe price (set ${priceIdKey} in Vercel env).`,
    )}`);
  }

  // Create / reuse the Stripe customer for the agency.
  let customerId = agencyRow.agency.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: agencyRow.agency.billingEmail ?? user.email ?? undefined,
      name: agencyRow.agency.name,
      metadata: { agency_id: agencyRow.agency.id },
    });
    customerId = customer.id;
    await db
      .update(schema.agencies)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(schema.agencies.id, agencyRow.agency.id));
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: { agency_id: agencyRow.agency.id, plan_tier: tier },
    },
    success_url: `${originUrl()}${site.routes.agency.billing}?status=success`,
    cancel_url: `${originUrl()}${site.routes.agency.billing}?status=cancelled`,
    allow_promotion_codes: true,
    metadata: { agency_id: agencyRow.agency.id, plan_tier: tier, billing_cycle: billingCycle },
  });

  if (!session.url) return;
  redirect(session.url);
}

export async function openCustomerPortal() {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) return;
  if (!agencyRow.agency.stripeCustomerId) {
    redirect(`${site.routes.agency.billing}?error=no-customer`);
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: agencyRow.agency.stripeCustomerId!,
    return_url: `${originUrl()}${site.routes.agency.billing}`,
  });
  if (!session.url) return;
  redirect(session.url);
}
