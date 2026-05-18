import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { serverEnv } from "@/config/env";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const secret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET ?? serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Bad signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type.startsWith("identity.verification_session.")) {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;
    if (userId) {
      const status =
        session.status === "verified"
          ? "approved"
          : session.status === "canceled" || session.status === "requires_input"
            ? "pending"
            : "rejected";

      await db
        .update(schema.verifications)
        .set({
          status,
          completedAt: status === "approved" ? new Date() : null,
          payload: session as unknown as Record<string, unknown>,
        })
        .where(eq(schema.verifications.providerRef, session.id));

      if (status === "approved") {
        await db
          .update(schema.ambassadors)
          .set({ verifiedIdAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.ambassadors.userId, userId));
      }
    }
  }

  return NextResponse.json({ received: true });
}
