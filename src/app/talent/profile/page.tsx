import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { site } from "@/config/site";
import { AmbassadorProfileForm } from "@/components/talent/ambassador-profile-form";

export const metadata = { title: "Your profile" };

export default async function TalentProfilePage() {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) {
    redirect(site.routes.home);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          This is what agencies see. Keep it sharp — it travels with you across every booking.
        </p>
      </div>
      <AmbassadorProfileForm
        ambassador={{
          displayName: ambassador.displayName,
          headline: ambassador.headline,
          bio: ambassador.bio,
          city: ambassador.city,
          state: ambassador.state,
          transport: ambassador.transport,
          willingToTravel: ambassador.willingToTravel,
          travelRadiusMiles: ambassador.travelRadiusMiles,
          languages: ambassador.languages,
          skills: ambassador.skills,
          hourlyRateMinCents: ambassador.hourlyRateMinCents,
          hourlyRateMaxCents: ambassador.hourlyRateMaxCents,
        }}
      />
    </div>
  );
}
