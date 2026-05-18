"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/roles";
import { getCategoryBySlug } from "@/server/queries/forum";
import { site } from "@/config/site";

export type ForumFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

const newThreadSchema = z.object({
  categorySlug: z.string().min(1),
  title: z.string().min(5, "Title is too short.").max(200),
  body: z.string().min(10, "Add a bit more — at least 10 characters.").max(40000),
});

export async function createThread(
  _prevState: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const user = await requireUser();
  const parsed = newThreadSchema.safeParse({
    categorySlug: formData.get("categorySlug"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const category = await getCategoryBySlug(parsed.data.categorySlug);
  if (!category || category.isLocked) {
    return { status: "error", message: "This category isn't accepting new threads." };
  }

  const slug = await uniqueThreadSlug(slugify(parsed.data.title));
  const now = new Date();
  const inserted = await db
    .insert(schema.forumThreads)
    .values({
      categoryId: category.id,
      authorUserId: user.id,
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      lastReplyAt: now,
    })
    .returning({ slug: schema.forumThreads.slug });

  revalidatePath(`${site.routes.forum}/${category.slug}`);
  redirect(`${site.routes.forum}/${category.slug}/${inserted[0].slug}`);
}

const replySchema = z.object({
  threadId: z.uuid(),
  body: z.string().min(1, "Empty reply.").max(40000),
  parentPostId: z.uuid().optional(),
});

export async function replyToThread(
  _prevState: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const user = await requireUser();
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
    parentPostId: formData.get("parentPostId") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Empty reply." };
  }

  const threadRows = await db
    .select({
      id: schema.forumThreads.id,
      slug: schema.forumThreads.slug,
      locked: schema.forumThreads.locked,
      categorySlug: schema.forumCategories.slug,
    })
    .from(schema.forumThreads)
    .innerJoin(schema.forumCategories, eq(schema.forumCategories.id, schema.forumThreads.categoryId))
    .where(eq(schema.forumThreads.id, parsed.data.threadId))
    .limit(1);
  const thread = threadRows[0];
  if (!thread) {
    return { status: "error", message: "Thread not found." };
  }
  if (thread.locked) {
    return { status: "error", message: "This thread is locked." };
  }

  const now = new Date();
  await db.insert(schema.forumPosts).values({
    threadId: thread.id,
    authorUserId: user.id,
    body: parsed.data.body,
    parentPostId: parsed.data.parentPostId ?? null,
  });
  await db
    .update(schema.forumThreads)
    .set({ lastReplyAt: now, updatedAt: now })
    .where(eq(schema.forumThreads.id, thread.id));

  revalidatePath(`${site.routes.forum}/${thread.categorySlug}/${thread.slug}`);
  return { status: "idle" };
}

const deleteSchema = z.object({
  postId: z.uuid(),
});

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const parsed = deleteSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) return;
  await db
    .delete(schema.forumPosts)
    .where(
      sql`${schema.forumPosts.id} = ${parsed.data.postId} and ${schema.forumPosts.authorUserId} = ${user.id}`,
    );
  revalidatePath(site.routes.forum);
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "thread"
  );
}

async function uniqueThreadSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  while (true) {
    const existing = await db
      .select({ id: schema.forumThreads.id })
      .from(schema.forumThreads)
      .where(eq(schema.forumThreads.slug, candidate))
      .limit(1);
    if (!existing[0]) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
