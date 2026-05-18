import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { latestVerification } from "@/server/queries/verifications";
import { startIdentityVerification } from "@/server/actions/verifications";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Verification" };

type Search = { searchParams: Promise<{ status?: string; error?: string }> };

export default async function VerificationPage({ searchParams }: Search) {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);

  const [idVerification, bgVerification] = await Promise.all([
    latestVerification(user.id, "id"),
    latestVerification(user.id, "background"),
  ]);

  const params = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Verification</h1>
        <p className="mt-1 text-muted-foreground">
          Verified badges unlock more gigs — especially alcohol promos, kids&apos; events, and
          high-value brands.
        </p>
      </div>

      {params.status === "submitted" ? (
        <p className="rounded-md border border-blue-500/40 bg-blue-500/5 p-3 text-sm">
          Submitted. Stripe usually confirms within a few minutes.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      {/* ID verification */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">ID verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We verify with Stripe Identity. Government ID + selfie. Reused across every gig.
            </p>
          </div>
          {ambassador.verifiedIdAt ? (
            <Badge variant="default">Verified</Badge>
          ) : idVerification?.status === "pending" ? (
            <Badge variant="outline">Pending</Badge>
          ) : (
            <Badge variant="outline">Not verified</Badge>
          )}
        </div>
        <div className="mt-4">
          {ambassador.verifiedIdAt ? (
            <p className="text-sm text-muted-foreground">
              Verified {formatDate(ambassador.verifiedIdAt)}.
            </p>
          ) : (
            <form action={startIdentityVerification}>
              <Button type="submit">
                {idVerification?.status === "pending" ? "Resume verification" : "Start ID verification"}
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* Background check */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Background check</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Triggered per-finalist by an agency on a specific job — they pay, you complete.
              Status persists on your profile.
            </p>
          </div>
          {ambassador.backgroundCheckStatus === "approved" ? (
            <Badge variant="default">Clear</Badge>
          ) : ambassador.backgroundCheckStatus === "pending" ? (
            <Badge variant="outline">Pending</Badge>
          ) : ambassador.backgroundCheckStatus === "rejected" ? (
            <Badge variant="destructive">Suspended</Badge>
          ) : (
            <Badge variant="outline">None</Badge>
          )}
        </div>
        {bgVerification ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Last update: {formatDate(bgVerification.updatedAt)}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-card p-5">{children}</div>;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
