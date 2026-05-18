import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listThreadsForCategory } from "@/server/queries/forum";
import { getCurrentUser } from "@/lib/auth/roles";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Params = { params: Promise<{ category: string }> };

export const revalidate = 30;

export async function generateMetadata({ params }: Params) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  return cat ? { title: cat.name, description: cat.description ?? undefined } : { title: "Forum" };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  const threads = await listThreadsForCategory(cat.id);
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <Link href={site.routes.forum} className="text-sm text-muted-foreground hover:text-foreground">
        ← Forum
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {cat.name}
          </h1>
          {cat.description ? (
            <p className="mt-1 text-muted-foreground">{cat.description}</p>
          ) : null}
        </div>
        {user && !cat.isLocked ? (
          <Link
            href={`${site.routes.forum}/${cat.slug}/new`}
            className={buttonVariants()}
          >
            New thread
          </Link>
        ) : !user ? (
          <Link
            href={`${site.routes.login}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Log in to post
          </Link>
        ) : null}
      </div>

      <ul className="mt-8 divide-y rounded-lg border bg-card">
        {threads.length === 0 ? (
          <li className="p-12 text-center text-sm text-muted-foreground">
            No threads yet. Be the first.
          </li>
        ) : (
          threads.map(({ thread, authorEmail, replyCount }) => (
            <li key={thread.id}>
              <Link
                href={`${site.routes.forum}/${cat.slug}/${thread.slug}`}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {thread.pinned ? <Badge variant="default">Pinned</Badge> : null}
                    {thread.locked ? <Badge variant="outline">Locked</Badge> : null}
                    <p className="truncate font-medium">{thread.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {authorEmail?.split("@")[0] ?? "anon"} • {replyCount} reply
                    {replyCount === 1 ? "" : "ies"} •{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(thread.lastReplyAt ?? thread.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
