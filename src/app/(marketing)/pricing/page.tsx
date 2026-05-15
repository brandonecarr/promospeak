import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { ANNUAL_DISCOUNT, formatPriceCents, planList, type Plan } from "@/config/pricing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing",
  description:
    "Agencies subscribe — ambassadors always free. Three tiers with a 14-day trial on Starter and Growth.",
};

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <header className="mx-auto max-w-2xl text-center">
        <p className="mb-4 inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pricing
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Agencies pay. {brand.copy.talentNounPlural} stay free, forever.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          14-day free trial on Starter and Growth. Cancel anytime. Annual saves about{" "}
          {Math.round(ANNUAL_DISCOUNT * 100)}%.
        </p>
      </header>

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
        {planList.map((plan) => (
          <PlanCard key={plan.tier} plan={plan} />
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
        Need something custom for staffing 100+ activations a month?{" "}
        <Link href={site.routes.contact} className="font-medium text-foreground hover:underline">
          Talk to us
        </Link>
        .
      </p>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isCustom = plan.monthlyPriceCents === 0;
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card p-6 shadow-sm",
        plan.highlight ? "border-foreground ring-1 ring-foreground" : null,
      )}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{plan.name}</h2>
        {plan.highlight ? (
          <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            Most popular
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

      <div className="mt-6">
        {isCustom ? (
          <p className="text-3xl font-semibold tracking-tight">Custom</p>
        ) : (
          <>
            <p className="text-3xl font-semibold tracking-tight">
              {formatPriceCents(plan.monthlyPriceCents)}
              <span className="ml-1 text-base font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or {formatPriceCents(plan.annualPriceCents)}/yr — saves about{" "}
              {Math.round(
                ((plan.monthlyPriceCents * 12 - plan.annualPriceCents) /
                  (plan.monthlyPriceCents * 12)) *
                  100,
              )}
              %
            </p>
          </>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-foreground" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link
          href={
            isCustom
              ? site.routes.contact
              : `${site.routes.signup}?role=agency&plan=${plan.tier}`
          }
          className={buttonVariants({
            variant: plan.highlight ? "default" : "outline",
            className: "w-full",
          })}
        >
          {isCustom ? "Talk to sales" : `Start ${plan.trialDays}-day trial`}
        </Link>
      </div>
    </div>
  );
}
