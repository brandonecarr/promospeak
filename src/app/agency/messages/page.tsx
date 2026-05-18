import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { listConversationsForAgency } from "@/server/queries/messages";
import { site } from "@/config/site";
import { ConversationList } from "@/components/messages/conversation-list";

export const metadata = { title: "Messages" };

export default async function AgencyMessagesPage() {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) redirect(site.routes.home);

  const conversations = await listConversationsForAgency(agencyRow.agency.id, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          DMs with ambassadors. Threads stay scoped to the application they started from.
        </p>
      </div>
      <ConversationList conversations={conversations} basePath={site.routes.agency.messages} />
    </div>
  );
}
