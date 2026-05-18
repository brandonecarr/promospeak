import { requireRole } from "@/lib/auth/roles";
import { listPublicAmbassadors } from "@/server/queries/ambassadors";
import { site } from "@/config/site";
import { AmbassadorCard } from "@/components/talent/ambassador-card";

export const metadata = { title: "Talent pool" };

type Search = { searchParams: Promise<{ city?: string; q?: string }> };

export default async function AgencyTalentPage({ searchParams }: Search) {
  await requireRole(["agency_member", "admin"]);
  const { city, q } = await searchParams;
  const ambassadors = await listPublicAmbassadors({
    city: city || undefined,
    search: q || undefined,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Talent pool</h1>
        <p className="mt-1 text-muted-foreground">
          Browse the active roster. Open a profile to see the full picture.
        </p>
      </div>

      <form action={site.routes.agency.talent} className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search skills, languages, name…"
          className="flex h-10 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          name="city"
          defaultValue={city ?? ""}
          placeholder="City"
          className="flex h-10 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Search
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ambassadors.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No matching ambassadors yet.
          </div>
        ) : (
          ambassadors.map((a) => (
            <AmbassadorCard
              key={a.id}
              ambassador={a}
              href={`${site.routes.publicAmbassadors}/${a.slug}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
