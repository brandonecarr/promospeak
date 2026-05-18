import "server-only";
import { and, desc, eq, ilike, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type AmbassadorListItem = {
  id: string;
  slug: string;
  displayName: string;
  headline: string | null;
  city: string | null;
  state: string | null;
  languages: string[];
  skills: string[];
  verifiedIdAt: Date | null;
  backgroundCheckStatus: "pending" | "approved" | "rejected" | null;
};

const listSelect = {
  id: schema.ambassadors.id,
  slug: schema.ambassadors.slug,
  displayName: schema.ambassadors.displayName,
  headline: schema.ambassadors.headline,
  city: schema.ambassadors.city,
  state: schema.ambassadors.state,
  languages: schema.ambassadors.languages,
  skills: schema.ambassadors.skills,
  verifiedIdAt: schema.ambassadors.verifiedIdAt,
  backgroundCheckStatus: schema.ambassadors.backgroundCheckStatus,
};

export async function listPublicAmbassadors(opts?: {
  limit?: number;
  city?: string;
  search?: string;
  requireBio?: boolean;
}): Promise<AmbassadorListItem[]> {
  const limit = opts?.limit ?? 60;
  const conditions = [];
  if (opts?.requireBio) {
    conditions.push(isNotNull(schema.ambassadors.bio));
  }
  if (opts?.city) {
    conditions.push(ilike(schema.ambassadors.city, `%${opts.city}%`));
  }
  if (opts?.search) {
    const q = `%${opts.search}%`;
    conditions.push(
      sql`(${schema.ambassadors.displayName} ilike ${q}
        or ${schema.ambassadors.headline} ilike ${q}
        or exists (select 1 from unnest(${schema.ambassadors.skills}) s where s ilike ${q})
        or exists (select 1 from unnest(${schema.ambassadors.languages}) l where l ilike ${q}))`,
    );
  }
  return db
    .select(listSelect)
    .from(schema.ambassadors)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.ambassadors.verifiedIdAt), desc(schema.ambassadors.createdAt))
    .limit(limit);
}

export async function getPublicAmbassadorBySlug(slug: string) {
  const rows = await db
    .select()
    .from(schema.ambassadors)
    .where(eq(schema.ambassadors.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}
