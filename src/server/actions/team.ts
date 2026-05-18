"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/roles";
import {
  getAgencyForUser,
  isAgencyOwnerOrAdmin,
} from "@/server/queries/profiles";
import {
  getAgencySubscription,
  planFor,
} from "@/server/queries/subscriptions";
import { listAgencyMembers } from "@/server/queries/team";
import { site } from "@/config/site";

export type TeamFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const inviteSchema = z.object({
  email: z.email("Enter a valid email."),
  role: z.enum(["admin", "recruiter"]).default("recruiter"),
});

export async function inviteAgencyMember(
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) return { status: "error", message: "No agency on file." };
  if (!(await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id))) {
    return { status: "error", message: "Only owners and admins can invite." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "recruiter",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Enforce per-plan seat limits.
  const sub = await getAgencySubscription(agencyRow.agency.id);
  const plan = planFor(sub);
  if (plan && plan.limits.teamSeats !== "unlimited") {
    const members = await listAgencyMembers(agencyRow.agency.id);
    if (members.length >= plan.limits.teamSeats) {
      return {
        status: "error",
        message: `Your ${plan.name} plan allows ${plan.limits.teamSeats} seat${
          plan.limits.teamSeats === 1 ? "" : "s"
        }. Upgrade or remove a member.`,
      };
    }
  }

  const supabase = createSupabaseAdminClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;
  const { error } = await supabase.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      role: "agency_member",
      display_name: parsed.data.email.split("@")[0],
      invited_agency_id: agencyRow.agency.id,
      invited_role: parsed.data.role,
    },
    redirectTo: `${origin}/auth/callback`,
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath(site.routes.agency.team);
  return { status: "success", message: `Invite sent to ${parsed.data.email}.` };
}

const removeSchema = z.object({ userId: z.uuid() });
export async function removeAgencyMember(formData: FormData) {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) return;
  if (!(await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id))) return;

  const parsed = removeSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return;
  if (parsed.data.userId === user.id) return; // can't remove yourself

  // Refuse to remove the last owner.
  const members = await listAgencyMembers(agencyRow.agency.id);
  const target = members.find((m) => m.userId === parsed.data.userId);
  if (!target) return;
  if (target.role === "owner") {
    const otherOwners = members.filter((m) => m.role === "owner" && m.userId !== parsed.data.userId);
    if (otherOwners.length === 0) return;
  }

  await db
    .delete(schema.agencyMembers)
    .where(
      and(
        eq(schema.agencyMembers.agencyId, agencyRow.agency.id),
        eq(schema.agencyMembers.userId, parsed.data.userId),
      ),
    );
  revalidatePath(site.routes.agency.team);
}
