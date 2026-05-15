import { brand } from "./brand";

export const site = {
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  defaultMeta: {
    title: brand.name,
    titleTemplate: `%s — ${brand.name}`,
    description:
      "PromoSpeak connects experiential marketing agencies with vetted brand ambassadors. Post gigs, find talent, run activations.",
    keywords: [
      "experiential marketing",
      "brand ambassadors",
      "promotional staffing",
      "event staffing",
      "promo models",
      "trade show staffing",
    ],
  },
  routes: {
    home: "/",
    pricing: "/pricing",
    about: "/about",
    contact: "/contact",
    insights: "/insights",
    legal: {
      terms: "/legal/terms",
      privacy: "/legal/privacy",
    },
    login: "/login",
    signup: "/signup",
    publicJobs: "/jobs",
    publicAmbassadors: "/ambassadors",
    forum: "/forum",
    agency: {
      root: "/agency",
      jobs: "/agency/jobs",
      jobsNew: "/agency/jobs/new",
      talent: "/agency/talent",
      messages: "/agency/messages",
      team: "/agency/team",
      billing: "/agency/billing",
      settings: "/agency/settings",
    },
    talent: {
      root: "/talent",
      jobs: "/talent/jobs",
      applications: "/talent/applications",
      calendar: "/talent/calendar",
      messages: "/talent/messages",
      portfolio: "/talent/portfolio",
      verification: "/talent/verification",
      profile: "/talent/profile",
      settings: "/talent/settings",
    },
    admin: {
      root: "/ps-admin",
      users: "/ps-admin/users",
      verifications: "/ps-admin/verifications",
      forum: "/ps-admin/forum",
      disputes: "/ps-admin/disputes",
    },
  },
} as const;

export type Site = typeof site;
