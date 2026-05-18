import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type TeamMember = {
  userId: string;
  email: string;
  role: "owner" | "admin" | "recruiter";
  joinedAt: Date;
};

export async function listAgencyMembers(agencyId: string): Promise<TeamMember[]> {
  const rows = await db
    .select({
      userId: schema.agencyMembers.userId,
      email: schema.users.email,
      role: schema.agencyMembers.role,
      joinedAt: schema.agencyMembers.createdAt,
    })
    .from(schema.agencyMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.agencyMembers.userId))
    .where(eq(schema.agencyMembers.agencyId, agencyId));
  return rows;
}
