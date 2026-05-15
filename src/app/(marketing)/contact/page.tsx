import { brand } from "@/config/brand";

export const metadata = {
  title: "Contact",
  description: `Get in touch with the ${brand.name} team.`,
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20">
      <p className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Contact
      </p>
      <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
        Get in touch.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Press, partnerships, or staffing an activation that doesn&apos;t fit a plan? Send us a
        note.
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            General
          </dt>
          <dd className="mt-1">
            <a className="text-base hover:underline" href={`mailto:${brand.supportEmail}`}>
              {brand.supportEmail}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            From the team
          </dt>
          <dd className="mt-1 text-base text-muted-foreground">
            We answer within one business day. Usually faster if the subject line includes a city.
          </dd>
        </div>
      </dl>
    </div>
  );
}
