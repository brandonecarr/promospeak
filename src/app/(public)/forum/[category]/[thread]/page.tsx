import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getThreadByCategoryAndSlug,
  incrementThreadView,
  listPostsForThread,
} from "@/server/queries/forum";
import { getCurrentUser } from "@/lib/auth/roles";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ReplyForm } from "@/components/forum/reply-form";

type Params = { params: Promise<{ category: string; thread: string }> };

export async function generateMetadata({ params }: Params) {
  const { category, thread } = await params;
  const row = await getThreadByCategoryAndSlug(category, thread);
  return row ? { title: row.thread.title } : { title: "Thread" };
}

export default async function ThreadPage({ params }: Params) {
  const { category, thread: threadSlug } = await params;
  const row = await getThreadByCategoryAndSlug(category, threadSlug);
  if (!row) notFound();

  // Fire-and-forget view counter.
  await incrementThreadView(row.thread.id);

  const posts = await listPostsForThread(row.thread.id);
  const user = await getCurrentUser();

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`${site.routes.forum}/${row.category.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {row.category.name}
      </Link>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          {row.thread.pinned ? <Badge variant="default">Pinned</Badge> : null}
          {row.thread.locked ? <Badge variant="outline">Locked</Badge> : null}
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {row.thread.title}
          </h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.authorEmail?.split("@")[0] ?? "anon"} •{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(row.thread.createdAt)}
        </p>
      </header>

      <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap rounded-lg border bg-card p-5 text-base leading-relaxed">
        {row.thread.body}
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {posts.length} {posts.length === 1 ? "reply" : "replies"}
        </h2>
        {posts.map(({ post, authorEmail }) => (
          <div key={post.id} className="rounded-md border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              {authorEmail?.split("@")[0] ?? "anon"} •{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(post.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
          </div>
        ))}
      </section>

      <div className="mt-10">
        {row.thread.locked ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            This thread is locked.
          </p>
        ) : user ? (
          <ReplyForm threadId={row.thread.id} />
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Link href={site.routes.login} className={buttonVariants({ size: "sm" })}>
              Log in to reply
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
