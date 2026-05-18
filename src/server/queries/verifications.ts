import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function listVerificationsForUser(userId: string) {
  return db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.userId, userId))
    .orderBy(desc(schema.verifications.createdAt));
}

export async function latestVerification(
  userId: string,
  kind: "id" | "background",
) {
  const rows = await db
    .select()
    .from(schema.verifications)
    .where(and(eq(schema.verifications.userId, userId), eq(schema.verifications.kind, kind)))
    .orderBy(desc(schema.verifications.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
