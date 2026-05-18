import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function listCategoriesWithCounts() {
  return db
    .select({
      id: schema.forumCategories.id,
      slug: schema.forumCategories.slug,
      name: schema.forumCategories.name,
      description: schema.forumCategories.description,
      sortOrder: schema.forumCategories.sortOrder,
      isLocked: schema.forumCategories.isLocked,
      threadCount: sql<number>`(
        select count(*)::int from public.forum_threads t
        where t.category_id = ${schema.forumCategories.id}
      )`,
      lastReplyAt: sql<Date | null>`(
        select max(t.last_reply_at) from public.forum_threads t
        where t.category_id = ${schema.forumCategories.id}
      )`,
    })
    .from(schema.forumCategories)
    .orderBy(asc(schema.forumCategories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select()
    .from(schema.forumCategories)
    .where(eq(schema.forumCategories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function listThreadsForCategory(categoryId: string) {
  return db
    .select({
      thread: schema.forumThreads,
      authorEmail: schema.users.email,
      replyCount: sql<number>`(
        select count(*)::int from public.forum_posts p
        where p.thread_id = ${schema.forumThreads.id}
      )`,
    })
    .from(schema.forumThreads)
    .leftJoin(schema.users, eq(schema.users.id, schema.forumThreads.authorUserId))
    .where(eq(schema.forumThreads.categoryId, categoryId))
    .orderBy(desc(schema.forumThreads.pinned), desc(schema.forumThreads.lastReplyAt));
}

export async function getThreadByCategoryAndSlug(categorySlug: string, threadSlug: string) {
  const rows = await db
    .select({
      thread: schema.forumThreads,
      category: schema.forumCategories,
      authorEmail: schema.users.email,
    })
    .from(schema.forumThreads)
    .innerJoin(schema.forumCategories, eq(schema.forumCategories.id, schema.forumThreads.categoryId))
    .leftJoin(schema.users, eq(schema.users.id, schema.forumThreads.authorUserId))
    .where(
      and(
        eq(schema.forumThreads.slug, threadSlug),
        eq(schema.forumCategories.slug, categorySlug),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listPostsForThread(threadId: string) {
  return db
    .select({
      post: schema.forumPosts,
      authorEmail: schema.users.email,
    })
    .from(schema.forumPosts)
    .leftJoin(schema.users, eq(schema.users.id, schema.forumPosts.authorUserId))
    .where(eq(schema.forumPosts.threadId, threadId))
    .orderBy(asc(schema.forumPosts.createdAt));
}

export async function incrementThreadView(threadId: string) {
  await db
    .update(schema.forumThreads)
    .set({ viewCount: sql`${schema.forumThreads.viewCount} + 1` })
    .where(eq(schema.forumThreads.id, threadId));
}
