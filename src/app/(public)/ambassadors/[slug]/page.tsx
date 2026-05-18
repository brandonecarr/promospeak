import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicAmbassadorBySlug } from "@/server/queries/ambassadors";
import { listMediaForAmbassador } from "@/server/queries/media";
import { PortfolioGrid } from "@/components/talent/portfolio-grid";
import { site } from "@/config/site";
import { brand } from "@/config/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const a = await getPublicAmbassadorBySlug(slug);
  if (!a) return { title: "Ambassador" };
  return {
    title: a.displayName,
    description: a.headline ?? `${a.displayName} on ${brand.name}`,
  };
}

export default async function PublicAmbassadorPage({ params }: Params) {
  const { slug } = await params;
  const a = await getPublicAmbassadorBySlug(slug);
  if (!a) notFound();

  const media = await listMediaForAmbassador(a.id);
  const location = [a.city, a.state].filter(Boolean).join(", ") || "Location TBD";

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href={site.routes.publicAmbassadors}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All ambassadors
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {a.displayName}
          </h1>
          {a.headline ? (
            <p className="mt-1 text-base text-muted-foreground">{a.headline}</p>
          ) : null}
          <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{location}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {a.verifiedIdAt ? <Badge variant="default">ID verified</Badge> : null}
          {a.backgroundCheckStatus === "approved" ? (
            <Badge variant="default">Background check ✓</Badge>
          ) : null}
        </div>
      </header>

      {a.bio ? (
        <section className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-base leading-relaxed">
          {a.bio}
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          {a.displayName} hasn&apos;t added a bio yet.
        </p>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Block label="Languages" items={a.languages} />
        <Block label="Skills" items={a.skills} />
      </section>

      {media.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Portfolio</h2>
          <div className="mt-4">
            <PortfolioGrid media={media} />
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-lg border bg-card p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          {a.transport ? (
            <Stat label="Transport" value={transportLabel(a.transport)} />
          ) : null}
          <Stat label="Travels" value={a.willingToTravel ? "Yes" : "Local only"} />
          {a.travelRadiusMiles ? (
            <Stat label="Travel radius" value={`${a.travelRadiusMiles} mi`} />
          ) : null}
          {a.hourlyRateMinCents !== null ? (
            <Stat
              label="Hourly rate"
              value={
                a.hourlyRateMaxCents
                  ? `${formatCents(a.hourlyRateMinCents)} – ${formatCents(a.hourlyRateMaxCents)}`
                  : `${formatCents(a.hourlyRateMinCents)}+`
              }
            />
          ) : null}
        </dl>
      </section>

      <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Want to message or book {a.displayName.split(" ")[0]}?
        </p>
        <Link href={site.routes.pricing} className={buttonVariants({ className: "mt-3" })}>
          See agency plans
        </Link>
      </div>
    </article>
  );
}

function Block({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Badge key={it} variant="outline">
            {it}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function transportLabel(t: "none" | "public" | "car"): string {
  return t === "car" ? "Car" : t === "public" ? "Public transit" : "None";
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
