import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { site } from "@/config/site";
import { AgencyProfileForm } from "@/components/agency/agency-profile-form";

export const metadata = { title: "Agency settings" };

export default async function AgencySettingsPage() {
  const { user } = await requireRole(["agency_member", "admin"]);
  const row = await getAgencyForUser(user.id);
  if (!row) {
    redirect(site.routes.home);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Agency settings</h1>
        <p className="mt-1 text-muted-foreground">
          Profile, contact, and billing details for{" "}
          <span className="font-medium text-foreground">{row.agency.name}</span>.
        </p>
      </div>
      <AgencyProfileForm
        agency={{
          id: row.agency.id,
          name: row.agency.name,
          website: row.agency.website,
          description: row.agency.description,
          hqCity: row.agency.hqCity,
          hqState: row.agency.hqState,
          billingEmail: row.agency.billingEmail,
        }}
      />
    </div>
  );
}
