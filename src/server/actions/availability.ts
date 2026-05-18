"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { site } from "@/config/site";

export type AvailabilityFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const recurringSchema = z
  .object({
    kind: z.literal("recurring"),
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    note: z.string().max(200).optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

const dateSchema = z
  .object({
    kind: z.enum(["block", "open"]),
    date: z.iso.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    note: z.string().max(200).optional(),
  })
  .refine(
    (d) => {
      if (!d.startTime || !d.endTime) return true;
      return d.endTime > d.startTime;
    },
    { message: "End time must be after start time.", path: ["endTime"] },
  );

export async function addAvailability(
  _prevState: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) return { status: "error", message: "No ambassador profile." };

  const kind = formData.get("kind");
  if (kind === "recurring") {
    const parsed = recurringSchema.safeParse({
      kind,
      weekday: formData.get("weekday"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      note: formData.get("note") ?? undefined,
    });
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid window." };
    }
    await db.insert(schema.availability).values({
      ambassadorId: ambassador.id,
      kind: parsed.data.kind,
      weekday: parsed.data.weekday,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      note: parsed.data.note ?? null,
    });
  } else if (kind === "block" || kind === "open") {
    const parsed = dateSchema.safeParse({
      kind,
      date: formData.get("date"),
      startTime: (formData.get("startTime") as string) || undefined,
      endTime: (formData.get("endTime") as string) || undefined,
      note: formData.get("note") ?? undefined,
    });
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid window." };
    }
    await db.insert(schema.availability).values({
      ambassadorId: ambassador.id,
      kind: parsed.data.kind,
      date: parsed.data.date,
      startTime: parsed.data.startTime ?? null,
      endTime: parsed.data.endTime ?? null,
      note: parsed.data.note ?? null,
    });
  } else {
    return { status: "error", message: "Invalid kind." };
  }

  revalidatePath(site.routes.talent.calendar);
  return { status: "idle" };
}

const removeSchema = z.object({ id: z.uuid() });
export async function removeAvailability(formData: FormData) {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) return;
  const parsed = removeSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  await db
    .delete(schema.availability)
    .where(
      and(
        eq(schema.availability.id, parsed.data.id),
        eq(schema.availability.ambassadorId, ambassador.id),
      ),
    );
  revalidatePath(site.routes.talent.calendar);
}
