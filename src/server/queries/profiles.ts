import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getAgencyForUser(userId: string) {
  const rows = await db
    .select({
      agency: schema.agencies,
      member: schema.agencyMembers,
    })
    .from(schema.agencyMembers)
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.agencyMembers.agencyId))
    .where(eq(schema.agencyMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAmbassadorForUser(userId: string) {
  const rows = await db
    .select()
    .from(schema.ambassadors)
    .where(eq(schema.ambassadors.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function isAgencyOwnerOrAdmin(userId: string, agencyId: string) {
  const rows = await db
    .select({ role: schema.agencyMembers.role })
    .from(schema.agencyMembers)
    .where(
      and(eq(schema.agencyMembers.userId, userId), eq(schema.agencyMembers.agencyId, agencyId)),
    )
    .limit(1);
  const role = rows[0]?.role;
  return role === "owner" || role === "admin";
}
