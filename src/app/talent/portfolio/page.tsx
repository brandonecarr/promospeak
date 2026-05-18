import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAmbassadorForUser } from "@/server/queries/profiles";
import { listMediaForAmbassador } from "@/server/queries/media";
import { removeMedia } from "@/server/actions/media";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";
import { AddMediaForm } from "@/components/talent/add-media-form";
import { PortfolioGrid } from "@/components/talent/portfolio-grid";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const { user } = await requireRole(["ambassador", "admin"]);
  const ambassador = await getAmbassadorForUser(user.id);
  if (!ambassador) redirect(site.routes.home);

  const media = await listMediaForAmbassador(ambassador.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-muted-foreground">
          Photos and short videos from past activations. Paste hosted URLs for now — direct upload
          ships next.
        </p>
      </div>
      <AddMediaForm />
      <PortfolioGrid
        media={media}
        action={(item) => (
          <form action={removeMedia}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" size="sm" variant="ghost">
              Remove
            </Button>
          </form>
        )}
      />
    </div>
  );
}
