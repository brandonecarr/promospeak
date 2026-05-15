export const brand = {
  name: "PromoSpeak",
  shortName: "PromoSpeak",
  legalName: "PromoSpeak, Inc.",
  tagline: "Where experiential marketing gets staffed.",
  domain: "promospeak.com",
  emailSender: "PromoSpeak <hello@promospeak.com>",
  supportEmail: "support@promospeak.com",
  socials: {
    twitter: "@promospeak",
    instagram: "@promospeak",
    linkedin: "company/promospeak",
  },
  copy: {
    agencyNoun: "agency",
    agencyNounPlural: "agencies",
    talentNoun: "ambassador",
    talentNounPlural: "ambassadors",
    gigNoun: "gig",
    gigNounPlural: "gigs",
    activationNoun: "activation",
  },
} as const;

export type Brand = typeof brand;
