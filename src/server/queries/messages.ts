import "server-only";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type ConversationListItem = {
  id: string;
  agencyId: string;
  ambassadorId: string;
  applicationId: string | null;
  lastMessageAt: Date | null;
  otherName: string;
  otherSubtitle: string | null;
  unreadCount: number;
  jobTitle: string | null;
};

export async function listConversationsForAgency(
  agencyId: string,
  currentUserId: string,
): Promise<ConversationListItem[]> {
  const rows = await db
    .select({
      conversation: schema.conversations,
      ambassadorName: schema.ambassadors.displayName,
      ambassadorHeadline: schema.ambassadors.headline,
      jobTitle: schema.jobs.title,
      unread: sql<number>`(
        select count(*)::int from public.messages m
        where m.conversation_id = ${schema.conversations.id}
          and m.sender_user_id <> ${currentUserId}
          and m.read_at is null
      )`,
    })
    .from(schema.conversations)
    .innerJoin(
      schema.ambassadors,
      eq(schema.ambassadors.id, schema.conversations.ambassadorId),
    )
    .leftJoin(schema.applications, eq(schema.applications.id, schema.conversations.applicationId))
    .leftJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(eq(schema.conversations.agencyId, agencyId))
    .orderBy(desc(schema.conversations.lastMessageAt));

  return rows.map((r) => ({
    id: r.conversation.id,
    agencyId: r.conversation.agencyId,
    ambassadorId: r.conversation.ambassadorId,
    applicationId: r.conversation.applicationId,
    lastMessageAt: r.conversation.lastMessageAt,
    otherName: r.ambassadorName,
    otherSubtitle: r.ambassadorHeadline,
    unreadCount: r.unread,
    jobTitle: r.jobTitle,
  }));
}

export async function listConversationsForAmbassador(
  ambassadorId: string,
  currentUserId: string,
): Promise<ConversationListItem[]> {
  const rows = await db
    .select({
      conversation: schema.conversations,
      agencyName: schema.agencies.name,
      jobTitle: schema.jobs.title,
      unread: sql<number>`(
        select count(*)::int from public.messages m
        where m.conversation_id = ${schema.conversations.id}
          and m.sender_user_id <> ${currentUserId}
          and m.read_at is null
      )`,
    })
    .from(schema.conversations)
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.conversations.agencyId))
    .leftJoin(schema.applications, eq(schema.applications.id, schema.conversations.applicationId))
    .leftJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(eq(schema.conversations.ambassadorId, ambassadorId))
    .orderBy(desc(schema.conversations.lastMessageAt));

  return rows.map((r) => ({
    id: r.conversation.id,
    agencyId: r.conversation.agencyId,
    ambassadorId: r.conversation.ambassadorId,
    applicationId: r.conversation.applicationId,
    lastMessageAt: r.conversation.lastMessageAt,
    otherName: r.agencyName,
    otherSubtitle: null,
    unreadCount: r.unread,
    jobTitle: r.jobTitle,
  }));
}

export type MessageEntry = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
};

export async function listMessages(conversationId: string): Promise<MessageEntry[]> {
  return db
    .select({
      id: schema.messages.id,
      conversationId: schema.messages.conversationId,
      senderUserId: schema.messages.senderUserId,
      body: schema.messages.body,
      createdAt: schema.messages.createdAt,
      readAt: schema.messages.readAt,
    })
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(asc(schema.messages.createdAt));
}

export async function getConversation(conversationId: string) {
  const rows = await db
    .select({
      conversation: schema.conversations,
      agencyName: schema.agencies.name,
      ambassadorName: schema.ambassadors.displayName,
      ambassadorUserId: schema.ambassadors.userId,
      jobTitle: schema.jobs.title,
      jobSlug: schema.jobs.slug,
    })
    .from(schema.conversations)
    .innerJoin(schema.agencies, eq(schema.agencies.id, schema.conversations.agencyId))
    .innerJoin(schema.ambassadors, eq(schema.ambassadors.id, schema.conversations.ambassadorId))
    .leftJoin(schema.applications, eq(schema.applications.id, schema.conversations.applicationId))
    .leftJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(eq(schema.conversations.id, conversationId))
    .limit(1);
  return rows[0] ?? null;
}

export async function isConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.id, conversationId),
        or(
          sql`exists (
            select 1 from public.agency_members m
            where m.agency_id = ${schema.conversations.agencyId} and m.user_id = ${userId}
          )`,
          sql`exists (
            select 1 from public.ambassadors a
            where a.id = ${schema.conversations.ambassadorId} and a.user_id = ${userId}
          )`,
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function findConversation(
  agencyId: string,
  ambassadorId: string,
  applicationId: string | null,
) {
  const rows = await db
    .select()
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.agencyId, agencyId),
        eq(schema.conversations.ambassadorId, ambassadorId),
        applicationId === null
          ? sql`${schema.conversations.applicationId} is null`
          : eq(schema.conversations.applicationId, applicationId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
