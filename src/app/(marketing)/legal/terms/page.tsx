import { brand } from "@/config/brand";

export const metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${brand.name}.`,
};

export default function TermsPage() {
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <article className="container mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Last updated {updated}
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
        Terms of Service
      </h1>

      <div className="prose prose-neutral mt-10 max-w-none text-base leading-relaxed">
        <p className="text-muted-foreground">
          These terms are a working placeholder. {brand.legalName} will replace this with the final
          ToS prior to public launch. Don&apos;t deploy with this copy without legal review.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">1. Who we are</h2>
        <p>
          {brand.name} is a marketplace operated by {brand.legalName}. We connect experiential
          marketing agencies with brand ambassadors and host an industry community forum.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">2. Roles</h2>
        <p>
          <strong>Agencies</strong> post job opportunities, review applicants, and manage the
          lifecycle of confirmed bookings. Agency accounts require a paid subscription.
        </p>
        <p>
          <strong>Ambassadors</strong> create profiles, browse and apply to jobs, and manage their
          availability. Ambassador accounts are free.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">3. Payments to ambassadors</h2>
        <p>
          {brand.name} does not hold, route, or escrow payments for work performed. Agencies pay
          ambassadors directly per their agreement. Tax reporting (e.g. 1099-NEC) is the
          agency&apos;s responsibility.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">4. Conduct</h2>
        <p>
          No harassment, no spam, no off-platform poaching of confirmed bookings, no fake reviews.
          Violations result in suspension. Forum posts are subject to moderation.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">5. Liability</h2>
        <p>
          {brand.name} is a venue for agencies and ambassadors to find each other. We don&apos;t
          employ ambassadors and we don&apos;t guarantee any specific outcome from a booking. Use
          the platform at your own risk.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">6. Changes</h2>
        <p>
          We&apos;ll update these terms as the platform evolves. Material changes get an email or
          in-app notice before they take effect.
        </p>
      </div>
    </article>
  );
}
