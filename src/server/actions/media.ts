"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { site } from "@/config/site";

export type MediaFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const addSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.url("Enter a valid URL."),
  caption: z.string().max(200).optional(),
  brandTag: z.string().max(80).optional(),
  roleTag: z.string().max(80).optional(),
  year: z.coerce.number().int().min(1990).max(2100).optional(),
});

export async function addMedia(
  _prevState: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) return { status: "error", message: "No ambassador profile." };

  const parsed = addSchema.safeParse({
    type: formData.get("type"),
    url: formData.get("url"),
    caption: formData.get("caption") || undefined,
    brandTag: formData.get("brandTag") || undefined,
    roleTag: formData.get("roleTag") || undefined,
    year: formData.get("year") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Append at the end.
  const maxRows = await db
    .select({ max: sql<number | null>`max(${schema.ambassadorMedia.sortOrder})` })
    .from(schema.ambassadorMedia)
    .where(eq(schema.ambassadorMedia.ambassadorId, ambassador.id));
  const sortOrder = (maxRows[0]?.max ?? -1) + 1;

  await db.insert(schema.ambassadorMedia).values({
    ambassadorId: ambassador.id,
    type: parsed.data.type,
    url: parsed.data.url,
    caption: parsed.data.caption ?? null,
    brandTag: parsed.data.brandTag ?? null,
    roleTag: parsed.data.roleTag ?? null,
    year: parsed.data.year ?? null,
    sortOrder,
  });

  revalidatePath(site.routes.talent.portfolio);
  revalidatePath(`${site.routes.publicAmbassadors}/${ambassador.slug}`);
  return { status: "idle" };
}

const removeSchema = z.object({ id: z.uuid() });
export async function removeMedia(formData: FormData) {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) return;
  const parsed = removeSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  await db
    .delete(schema.ambassadorMedia)
    .where(
      and(
        eq(schema.ambassadorMedia.id, parsed.data.id),
        eq(schema.ambassadorMedia.ambassadorId, ambassador.id),
      ),
    );
  revalidatePath(site.routes.talent.portfolio);
  revalidatePath(`${site.routes.publicAmbassadors}/${ambassador.slug}`);
}
