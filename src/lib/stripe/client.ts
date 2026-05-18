import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/config/env";

let _stripe: Stripe | null = null;

export function stripe() {
  if (!_stripe) {
    const key = serverEnv().STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export function stripeWebhookSecret(): string {
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}
