import { NextResponse } from "next/server";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { serverEnv } from "@/config/env";
import { plans, type PlanTier } from "@/config/pricing";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      serverEnv().STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Bad signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.customer) {
        const subscription = await stripe().subscriptions.retrieve(session.subscription as string);
        await syncSubscription(subscription);
      }
      break;
    }
    default:
      // ignore other events for now
      break;
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription) {
  const agencyId = sub.metadata?.agency_id;
  if (!agencyId) return;

  const planTier = (sub.metadata?.plan_tier ?? tierFromPriceId(sub.items.data[0]?.price?.id)) as
    | PlanTier
    | undefined;
  if (!planTier || !(planTier in plans)) return;

  const status = sub.status as typeof schema.subscriptions.$inferInsert.status;
  // Stripe moved `current_period_end` onto subscription items in newer API
  // versions. Read from the item if the top-level field isn't present.
  const itemEnd = sub.items.data[0]?.current_period_end;
  const subAny = sub as unknown as { current_period_end?: number };
  const periodEndSeconds = subAny.current_period_end ?? itemEnd ?? null;
  const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;
  const trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

  const existing = await db
    .select({ id: schema.subscriptions.id })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.agencyId, agencyId),
        eq(schema.subscriptions.stripeSubscriptionId, sub.id),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.subscriptions)
      .set({
        planTier,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        trialEndsAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, existing[0].id));
  } else {
    await db.insert(schema.subscriptions).values({
      agencyId,
      stripeSubscriptionId: sub.id,
      planTier,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialEndsAt,
    });
  }
}

function tierFromPriceId(priceId: string | undefined): PlanTier | null {
  if (!priceId) return null;
  for (const [tier, plan] of Object.entries(plans) as [PlanTier, (typeof plans)[PlanTier]][]) {
    if (
      process.env[plan.stripeMonthlyPriceIdEnvKey] === priceId ||
      process.env[plan.stripeAnnualPriceIdEnvKey] === priceId
    ) {
      return tier;
    }
  }
  return null;
}
