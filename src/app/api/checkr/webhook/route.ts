import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { serverEnv } from "@/config/env";

// Checkr signs webhooks with HMAC-SHA256 of the body using the webhook secret.
// See: https://docs.checkr.com/reference/webhooks
export async function POST(request: Request) {
  const env = serverEnv();
  if (!env.CHECKR_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Checkr webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-checkr-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", env.CHECKR_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  if (!safeEqual(expected, signature)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    type: string;
    data: { object: { id: string; status?: string; candidate_id?: string } };
  };

  if (event.type.startsWith("report.")) {
    const report = event.data.object;
    const status =
      report.status === "clear" || report.status === "consider"
        ? "approved"
        : report.status === "suspended"
          ? "rejected"
          : "pending";

    const updated = await db
      .update(schema.verifications)
      .set({
        status,
        completedAt: status !== "pending" ? new Date() : null,
        payload: event as unknown as Record<string, unknown>,
      })
      .where(eq(schema.verifications.providerRef, report.id))
      .returning({ userId: schema.verifications.userId });

    if (updated[0]) {
      await db
        .update(schema.ambassadors)
        .set({ backgroundCheckStatus: status, updatedAt: new Date() })
        .where(eq(schema.ambassadors.userId, updated[0].userId));
    }
  }

  return NextResponse.json({ received: true });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
