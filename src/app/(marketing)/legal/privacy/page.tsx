import { brand } from "@/config/brand";

export const metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${brand.name}.`,
};

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>

      <div className="prose prose-neutral mt-10 max-w-none text-base leading-relaxed">
        <p className="text-muted-foreground">
          Working placeholder. {brand.legalName} will replace this with the final privacy notice
          before launch. CCPA and GDPR-ready treatment of personal data is in scope.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">What we collect</h2>
        <ul>
          <li>Account info: email, name, role (agency / ambassador / admin).</li>
          <li>Profile info: photos, bio, location, skills, availability, sizes.</li>
          <li>Activity: applications, bookings, messages, forum posts.</li>
          <li>Billing info: handled by Stripe; we store customer/subscription IDs, not card data.</li>
          <li>Verifications: ID via Stripe Identity; background checks via Checkr where applicable.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">How we use it</h2>
        <ul>
          <li>To run the marketplace: showing your profile to agencies, ranking matched jobs, etc.</li>
          <li>To support you: replying to email, troubleshooting, fraud prevention.</li>
          <li>Aggregate, anonymized stats power the public &ldquo;State of Experiential&rdquo; dashboard.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">Who sees what</h2>
        <p>
          Public profile fields (photo, headline, city) are visible on your ambassador page.
          Sensitive fields (phone, exact address, ID verification status detail) are only visible to
          paying agencies you&apos;ve applied to or you have a booking with. Forum posts are public to
          all logged-in users.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight">Your rights</h2>
        <ul>
          <li>Export your data at any time from your settings.</li>
          <li>Delete your account: soft-delete with 30-day recovery, then hard-purge of media.</li>
          <li>Email <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> for anything we don&apos;t surface in-product yet.</li>
        </ul>
      </div>
    </article>
  );
}
