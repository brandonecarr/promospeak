import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type MediaItem = typeof schema.ambassadorMedia.$inferSelect;

export async function listMediaForAmbassador(ambassadorId: string): Promise<MediaItem[]> {
  return db
    .select()
    .from(schema.ambassadorMedia)
    .where(eq(schema.ambassadorMedia.ambassadorId, ambassadorId))
    .orderBy(asc(schema.ambassadorMedia.sortOrder), asc(schema.ambassadorMedia.createdAt));
}
