"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/roles";
import { isAgencyOwnerOrAdmin } from "@/server/queries/profiles";
import { site } from "@/config/site";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; message: string };

const TRANSPORT_VALUES = ["none", "public", "car"] as const;

// ─── Agency ────────────────────────────────────────────────────────────────
const agencySchema = z.object({
  name: z.string().min(2, "Agency name is required.").max(200),
  website: z.union([z.url("Enter a valid URL."), z.literal("")]).optional(),
  description: z.string().max(2000).optional(),
  hqCity: z.string().max(120).optional(),
  hqState: z.string().max(120).optional(),
  billingEmail: z.union([z.email("Enter a valid email."), z.literal("")]).optional(),
});

export async function updateAgencyProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyId = formData.get("agencyId");
  if (typeof agencyId !== "string" || !agencyId) {
    return { status: "error", message: "Missing agency reference." };
  }

  if (!(await isAgencyOwnerOrAdmin(user.id, agencyId))) {
    return { status: "error", message: "You don't have permission to edit this agency." };
  }

  const parsed = agencySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website") ?? "",
    description: formData.get("description") ?? "",
    hqCity: formData.get("hqCity") ?? "",
    hqState: formData.get("hqState") ?? "",
    billingEmail: formData.get("billingEmail") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  await db
    .update(schema.agencies)
    .set({
      name: parsed.data.name,
      website: parsed.data.website || null,
      description: parsed.data.description || null,
      hqCity: parsed.data.hqCity || null,
      hqState: parsed.data.hqState || null,
      billingEmail: parsed.data.billingEmail || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.agencies.id, agencyId));

  revalidatePath(site.routes.agency.settings);
  return { status: "success", message: "Agency profile saved." };
}

// ─── Ambassador ────────────────────────────────────────────────────────────
const ambassadorSchema = z.object({
  displayName: z.string().min(2, "Display name is required.").max(120),
  headline: z.string().max(160).optional(),
  bio: z.string().max(4000).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  transport: z.enum(TRANSPORT_VALUES),
  willingToTravel: z.boolean(),
  travelRadiusMiles: z.coerce.number().int().min(0).max(5000).optional(),
  languages: z.string().max(500).optional(),
  skills: z.string().max(500).optional(),
  hourlyRateMinCents: z.coerce.number().int().min(0).max(100000000).optional(),
  hourlyRateMaxCents: z.coerce.number().int().min(0).max(100000000).optional(),
});

export async function updateAmbassadorProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { user } = await requireRole(["ambassador", "admin"]);

  const raw = {
    displayName: formData.get("displayName"),
    headline: formData.get("headline") ?? "",
    bio: formData.get("bio") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    transport: (formData.get("transport") ?? "none") as (typeof TRANSPORT_VALUES)[number],
    willingToTravel: formData.get("willingToTravel") === "on",
    travelRadiusMiles: formData.get("travelRadiusMiles") || undefined,
    languages: formData.get("languages") ?? "",
    skills: formData.get("skills") ?? "",
    hourlyRateMinCents: formData.get("hourlyRateMinCents") || undefined,
    hourlyRateMaxCents: formData.get("hourlyRateMaxCents") || undefined,
  };

  const parsed = ambassadorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  if (
    data.hourlyRateMinCents !== undefined &&
    data.hourlyRateMaxCents !== undefined &&
    data.hourlyRateMaxCents < data.hourlyRateMinCents
  ) {
    return {
      status: "error",
      message: "Max hourly rate can't be lower than the minimum.",
      fieldErrors: { hourlyRateMaxCents: ["Max must be ≥ min."] },
    };
  }

  await db
    .update(schema.ambassadors)
    .set({
      displayName: data.displayName,
      headline: data.headline || null,
      bio: data.bio || null,
      city: data.city || null,
      state: data.state || null,
      transport: data.transport,
      willingToTravel: data.willingToTravel,
      travelRadiusMiles: data.travelRadiusMiles ?? null,
      languages: splitList(data.languages),
      skills: splitList(data.skills),
      hourlyRateMinCents: data.hourlyRateMinCents ?? null,
      hourlyRateMaxCents: data.hourlyRateMaxCents ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.ambassadors.userId, user.id));

  revalidatePath(site.routes.talent.profile);
  return { status: "success", message: "Profile saved." };
}

function splitList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
