import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser, isAgencyOwnerOrAdmin } from "@/server/queries/profiles";
import { listAgencyMembers } from "@/server/queries/team";
import { getAgencySubscription, planFor } from "@/server/queries/subscriptions";
import { removeAgencyMember } from "@/server/actions/team";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteForm } from "@/components/agency/invite-form";

export const metadata = { title: "Team" };

export default async function AgencyTeamPage() {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) redirect(site.routes.home);

  const [members, sub] = await Promise.all([
    listAgencyMembers(agencyRow.agency.id),
    getAgencySubscription(agencyRow.agency.id),
  ]);
  const plan = planFor(sub);
  const seatLimit = plan?.limits.teamSeats ?? "unlimited";
  const isManager = await isAgencyOwnerOrAdmin(user.id, agencyRow.agency.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-muted-foreground">
          Invite teammates to manage jobs and applicants under {agencyRow.agency.name}.{" "}
          {seatLimit === "unlimited"
            ? "Your plan has unlimited seats."
            : `Using ${members.length}/${seatLimit} seat${seatLimit === 1 ? "" : "s"}.`}
        </p>
      </div>

      {isManager ? <InviteForm /> : null}

      <ul className="divide-y rounded-lg border bg-card">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{m.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(m.joinedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {m.role}
              </Badge>
              {isManager && m.userId !== user.id && m.role !== "owner" ? (
                <form action={removeAgencyMember}>
                  <input type="hidden" name="userId" value={m.userId} />
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
