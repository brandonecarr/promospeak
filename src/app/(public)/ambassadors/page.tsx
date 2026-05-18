import { listPublicAmbassadors } from "@/server/queries/ambassadors";
import { site } from "@/config/site";
import { AmbassadorCard } from "@/components/talent/ambassador-card";

export const metadata = {
  title: "Ambassadors",
  description:
    "Browse vetted promotional marketing talent — bilingual hosts, brand demonstrators, mobile-tour pros, trade-show specialists.",
};

export const revalidate = 60;

type Search = { searchParams: Promise<{ city?: string; q?: string }> };

export default async function PublicAmbassadorsPage({ searchParams }: Search) {
  const { city, q } = await searchParams;
  const ambassadors = await listPublicAmbassadors({
    city: city || undefined,
    search: q || undefined,
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="mb-3 inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ambassadors
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          The talent running the floor.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Hosts, demonstrators, samplers, multilingual specialists, and more. Browse free — sign up
          as an agency to message and book.
        </p>
      </header>

      <form
        action={site.routes.publicAmbassadors}
        className="mx-auto mt-10 flex max-w-2xl flex-wrap gap-2"
      >
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

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
