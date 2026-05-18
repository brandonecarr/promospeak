import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getAgencyForUser } from "@/server/queries/profiles";
import { getAgencySubscription, isSubscriptionActive } from "@/server/queries/subscriptions";
import { startCheckout, openCustomerPortal } from "@/server/actions/billing";
import { plans, planList, formatPriceCents, type Plan } from "@/config/pricing";
import { site } from "@/config/site";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Billing" };

type Search = { searchParams: Promise<{ status?: string; error?: string }> };

export default async function AgencyBillingPage({ searchParams }: Search) {
  const { user } = await requireRole(["agency_member", "admin"]);
  const agencyRow = await getAgencyForUser(user.id);
  if (!agencyRow) redirect(site.routes.home);
  const sub = await getAgencySubscription(agencyRow.agency.id);
  const params = await searchParams;
  const active = isSubscriptionActive(sub);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your {agencyRow.agency.name} subscription.
        </p>
      </div>

      {params.status === "success" ? (
        <p className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm">
          Subscription started. It may take a few seconds for status to refresh.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {params.error.replace(/-/g, " ")}
        </p>
      ) : null}

      {sub ? (
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                {plans[sub.planTier].name}
              </p>
            </div>
            <Badge variant={active ? "default" : "outline"} className="capitalize">
              {sub.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {sub.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
              </dt>
              <dd className="mt-0.5">
                {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
              </dd>
            </div>
            {sub.trialEndsAt ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Trial ends
                </dt>
                <dd className="mt-0.5">{formatDate(sub.trialEndsAt)}</dd>
              </div>
            ) : null}
          </dl>
          <form action={openCustomerPortal} className="mt-5">
            <Button type="submit" variant="outline">
              Manage in Stripe portal
            </Button>
          </form>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6">
          <p className="text-sm">
            No active subscription. Pick a plan to start posting jobs and contacting ambassadors.
          </p>
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {planList.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} currentTier={sub?.planTier ?? null} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlanCard({ plan, currentTier }: { plan: Plan; currentTier: string | null }) {
  const isCurrent = currentTier === plan.tier;
  const isCustom = plan.monthlyPriceCents === 0;
  return (
    <div className="flex flex-col rounded-lg border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
        {isCurrent ? <Badge variant="default">Current</Badge> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {isCustom ? "Custom" : `${formatPriceCents(plan.monthlyPriceCents)}/mo`}
      </p>
      <ul className="mt-3 flex-1 space-y-1.5 text-sm">
        {plan.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-1.5">
            <span className="mt-1 inline-block size-1 shrink-0 rounded-full bg-foreground" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        {isCustom ? (
          <Link
            href={site.routes.contact}
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Talk to sales
          </Link>
        ) : isCurrent ? (
          <Button variant="outline" className="w-full" disabled>
            Current plan
          </Button>
        ) : (
          <form action={startCheckout}>
            <input type="hidden" name="tier" value={plan.tier} />
            <input type="hidden" name="cycle" value="monthly" />
            <Button type="submit" className="w-full">
              {currentTier ? "Switch plan" : `Start ${plan.trialDays}-day trial`}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
