"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/roles";
import { getAgencyForUser, getAmbassadorForUser } from "@/server/queries/profiles";
import {
  findConversation,
  isConversationParticipant,
} from "@/server/queries/messages";
import { site } from "@/config/site";

export type MessageFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const sendSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().min(1, "Empty message.").max(8000),
});

export async function sendMessage(
  _prevState: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const user = await requireUser();
  const parsed = sendSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Message can't be empty." };
  }

  if (!(await isConversationParticipant(parsed.data.conversationId, user.id))) {
    return { status: "error", message: "Conversation not found." };
  }

  const now = new Date();
  await db.insert(schema.messages).values({
    conversationId: parsed.data.conversationId,
    senderUserId: user.id,
    body: parsed.data.body.trim(),
  });

  await db
    .update(schema.conversations)
    .set({ lastMessageAt: now })
    .where(eq(schema.conversations.id, parsed.data.conversationId));

  revalidatePath(`${site.routes.agency.messages}/${parsed.data.conversationId}`);
  revalidatePath(`${site.routes.talent.messages}/${parsed.data.conversationId}`);
  return { status: "idle" };
}

const markReadSchema = z.object({
  conversationId: z.uuid(),
});

export async function markConversationRead(formData: FormData) {
  const user = await requireUser();
  const parsed = markReadSchema.safeParse({ conversationId: formData.get("conversationId") });
  if (!parsed.success) return;
  if (!(await isConversationParticipant(parsed.data.conversationId, user.id))) return;

  await db
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.messages.conversationId, parsed.data.conversationId),
        ne(schema.messages.senderUserId, user.id),
        isNull(schema.messages.readAt),
      ),
    );
  revalidatePath(site.routes.agency.messages);
  revalidatePath(site.routes.talent.messages);
}

// Start (or reuse) a conversation. Either party can initiate.
const startSchema = z.object({
  counterpartUserId: z.uuid().optional(),
  ambassadorId: z.uuid().optional(),
  agencyId: z.uuid().optional(),
  applicationId: z.uuid().optional(),
});

export async function startConversation(formData: FormData) {
  const user = await requireUser();
  const parsed = startSchema.safeParse({
    counterpartUserId: formData.get("counterpartUserId") || undefined,
    ambassadorId: formData.get("ambassadorId") || undefined,
    agencyId: formData.get("agencyId") || undefined,
    applicationId: formData.get("applicationId") || undefined,
  });
  if (!parsed.success) return;

  let agencyId: string | null = null;
  let ambassadorId: string | null = null;

  const agencyForUser = await getAgencyForUser(user.id);
  const ambassadorForUser = await getAmbassadorForUser(user.id);

  if (agencyForUser) {
    agencyId = agencyForUser.agency.id;
    ambassadorId = parsed.data.ambassadorId ?? null;
  } else if (ambassadorForUser) {
    ambassadorId = ambassadorForUser.id;
    agencyId = parsed.data.agencyId ?? null;
  }

  if (!agencyId || !ambassadorId) return;

  const existing = await findConversation(agencyId, ambassadorId, parsed.data.applicationId ?? null);
  if (existing) {
    redirectToConversation(existing.id, !!agencyForUser);
  }

  const inserted = await db
    .insert(schema.conversations)
    .values({
      agencyId,
      ambassadorId,
      applicationId: parsed.data.applicationId ?? null,
    })
    .returning({ id: schema.conversations.id });

  redirectToConversation(inserted[0].id, !!agencyForUser);
}

function redirectToConversation(conversationId: string, asAgency: boolean): never {
  const base = asAgency ? site.routes.agency.messages : site.routes.talent.messages;
  redirect(`${base}/${conversationId}`);
}
