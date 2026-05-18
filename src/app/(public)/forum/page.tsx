import Link from "next/link";
import { listCategoriesWithCounts } from "@/server/queries/forum";
import { site } from "@/config/site";
import { brand } from "@/config/brand";

export const metadata = {
  title: "Forum",
  description: `${brand.name} forum — the experiential marketing industry's gathering place.`,
};

export const revalidate = 30;

export default async function ForumIndexPage() {
  const categories = await listCategoriesWithCounts();
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <header>
        <p className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Forum
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          The industry hangout.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Stories from the road, agency talk, gear, city scenes, and newbie questions. Anyone can
          read — sign in to post.
        </p>
      </header>

      <ul className="mt-10 divide-y rounded-lg border bg-card">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`${site.routes.forum}/${c.slug}`}
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-muted/30"
            >
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight">{c.name}</p>
                {c.description ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>{c.threadCount} thread{c.threadCount === 1 ? "" : "s"}</p>
                {c.lastReplyAt ? <p className="mt-0.5">{formatRel(c.lastReplyAt)}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatRel(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}
