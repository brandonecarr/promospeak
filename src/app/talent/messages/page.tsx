import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { listConversationsForAmbassador } from "@/server/queries/messages";
import { site } from "@/config/site";
import { ConversationList } from "@/components/messages/conversation-list";

export const metadata = { title: "Messages" };

export default async function TalentMessagesPage() {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);

  const conversations = await listConversationsForAmbassador(ambassador.id, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          DMs from agencies. Reply to keep the gig moving.
        </p>
      </div>
      <ConversationList conversations={conversations} basePath={site.routes.talent.messages} />
    </div>
  );
}
