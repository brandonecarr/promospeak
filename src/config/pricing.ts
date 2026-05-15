export type PlanTier = "starter" | "growth" | "enterprise";

export type PlanLimits = {
  maxActiveJobs: number | "unlimited";
  maxApplicationsPerMonth: number | "unlimited";
  teamSeats: number | "unlimited";
  aiMatchingShortlist: boolean;
  featuredListings: boolean;
  apiAccess: boolean;
};

export type Plan = {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  stripeMonthlyPriceIdEnvKey: string;
  stripeAnnualPriceIdEnvKey: string;
  trialDays: number;
  features: string[];
  limits: PlanLimits;
  highlight?: boolean;
};

export const ANNUAL_DISCOUNT = 0.17;

export const plans: Record<PlanTier, Plan> = {
  starter: {
    tier: "starter",
    name: "Starter",
    description: "For small shops just getting started.",
    monthlyPriceCents: 4900,
    annualPriceCents: 48800,
    stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_STARTER_MONTHLY",
    stripeAnnualPriceIdEnvKey: "STRIPE_PRICE_STARTER_ANNUAL",
    trialDays: 14,
    features: [
      "Up to 5 active job posts",
      "25 applications/month",
      "Basic agency profile",
      "Standard support",
    ],
    limits: {
      maxActiveJobs: 5,
      maxApplicationsPerMonth: 25,
      teamSeats: 1,
      aiMatchingShortlist: false,
      featuredListings: false,
      apiAccess: false,
    },
  },
  growth: {
    tier: "growth",
    name: "Growth",
    description: "For agencies running activations every week.",
    monthlyPriceCents: 14900,
    annualPriceCents: 148400,
    stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_GROWTH_MONTHLY",
    stripeAnnualPriceIdEnvKey: "STRIPE_PRICE_GROWTH_ANNUAL",
    trialDays: 14,
    features: [
      "Unlimited job posts",
      "Unlimited applications",
      "AI matching shortlist",
      "Featured listings",
      "3 team seats",
      "Priority support",
    ],
    limits: {
      maxActiveJobs: "unlimited",
      maxApplicationsPerMonth: "unlimited",
      teamSeats: 3,
      aiMatchingShortlist: true,
      featuredListings: true,
      apiAccess: false,
    },
    highlight: true,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    description: "For agencies staffing at scale.",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
    stripeAnnualPriceIdEnvKey: "STRIPE_PRICE_ENTERPRISE_ANNUAL",
    trialDays: 0,
    features: [
      "Everything in Growth",
      "Unlimited team seats",
      "API access",
      "Dedicated success manager",
      "Advanced analytics",
      "White-label options",
    ],
    limits: {
      maxActiveJobs: "unlimited",
      maxApplicationsPerMonth: "unlimited",
      teamSeats: "unlimited",
      aiMatchingShortlist: true,
      featuredListings: true,
      apiAccess: true,
    },
  },
};

export const planList: Plan[] = [plans.starter, plans.growth, plans.enterprise];

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
