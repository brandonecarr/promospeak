import Link from "next/link";
import {
  type AgencySubscription,
  isSubscriptionActive,
} from "@/server/queries/subscriptions";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export function SubscriptionBanner({ sub }: { sub: AgencySubscription }) {
  if (sub && sub.status === "trialing" && sub.trialEndsAt) {
    const daysLeft = daysUntil(sub.trialEndsAt);
    return (
      <Banner tone="info">
        <span>
          You&apos;re on a trial — {daysLeft} day{daysLeft === 1 ? "" : "s"} left. Card-on-file
          required to keep posting after that.
        </span>
        <Link href={site.routes.agency.billing} className={buttonVariants({ size: "sm" })}>
          Manage billing
        </Link>
      </Banner>
    );
  }
  if (sub && ["past_due", "incomplete"].includes(sub.status)) {
    return (
      <Banner tone="warn">
        <span>Your payment is past due. Update billing to keep your jobs live.</span>
        <Link href={site.routes.agency.billing} className={buttonVariants({ size: "sm" })}>
          Fix billing
        </Link>
      </Banner>
    );
  }
  if (!isSubscriptionActive(sub)) {
    return (
      <Banner tone="warn">
        <span>No active subscription — drafts work, but publishing jobs requires a plan.</span>
        <Link href={site.routes.agency.billing} className={buttonVariants({ size: "sm" })}>
          Pick a plan
        </Link>
      </Banner>
    );
  }
  return null;
}

function daysUntil(d: Date): number {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

function Banner({
  tone,
  children,
}: {
  tone: "info" | "warn";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200"
      : "border-blue-500/40 bg-blue-500/5";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm ${cls}`}
    >
      {children}
    </div>
  );
}
