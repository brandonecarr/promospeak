import { describe, it, expect } from "vitest";
import { brand } from "@/config/brand";
import { plans, planList, formatPriceCents } from "@/config/pricing";
import { site } from "@/config/site";

describe("brand config", () => {
  it("uses the locked PromoSpeak name", () => {
    expect(brand.name).toBe("PromoSpeak");
  });
});

describe("pricing config", () => {
  it("exposes all three tiers in order", () => {
    expect(planList.map((p) => p.tier)).toEqual(["starter", "growth", "enterprise"]);
  });

  it("highlights the Growth plan", () => {
    expect(plans.growth.highlight).toBe(true);
  });

  it("formats cents to USD", () => {
    expect(formatPriceCents(4900)).toBe("$49");
  });
});

describe("site routes", () => {
  it("uses /ps-admin instead of /admin", () => {
    expect(site.routes.admin.root).toBe("/ps-admin");
  });

  it("separates public ambassadors directory from talent dashboard", () => {
    expect(site.routes.publicAmbassadors).toBe("/ambassadors");
    expect(site.routes.talent.root).toBe("/talent");
  });
});
