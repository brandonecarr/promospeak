import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import {
  getConversation,
  isConversationParticipant,
  listMessages,
} from "@/server/queries/messages";
import { markConversationRead } from "@/server/actions/messages";
import { site } from "@/config/site";
import { ThreadView } from "@/components/messages/thread-view";
import { MessageComposer } from "@/components/messages/message-composer";

export const metadata = { title: "Conversation" };

type Params = { params: Promise<{ id: string }> };

export default async function TalentConversationPage({ params }: Params) {
  const { id } = await params;
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);
  if (!(await isConversationParticipant(id, user.id))) notFound();

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const messages = await listMessages(id);
  const fd = new FormData();
  fd.set("conversationId", id);
  await markConversationRead(fd);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <header className="mb-4">
        <Link
          href={site.routes.talent.messages}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All messages
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {conversation.agencyName}
        </h1>
        {conversation.jobTitle ? (
          <p className="text-sm text-muted-foreground">re: {conversation.jobTitle}</p>
        ) : null}
      </header>
      <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4">
        <ThreadView messages={messages} currentUserId={user.id} />
      </div>
      <div className="mt-4">
        <MessageComposer conversationId={id} />
      </div>
    </div>
  );
}
