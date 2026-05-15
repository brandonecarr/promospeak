import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "About",
  description:
    "PromoSpeak is a modern rebuild of the experiential marketing industry's original hangout. Agencies post gigs. Ambassadors build portfolios that travel with them.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20">
      <p className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        About
      </p>
      <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
        The industry&apos;s hangout, rebuilt.
      </h1>

      <div className="prose prose-neutral mt-10 max-w-none text-base leading-relaxed text-muted-foreground">
        <p>
          Experiential marketing — sampling, demos, trade shows, mobile tours, street teams — is
          bigger than ever. World Cup, Olympics, festival circuits, retail activations. Thousands
          of ambassadors per activation, dozens of agencies running them, every weekend, every city.
        </p>
        <p>
          For two decades, the original EventSpeak was where the industry met. Agencies posted
          gigs. Ambassadors built portfolios. The forum was the moat. Then it went quiet.
        </p>
        <p>
          {brand.name} is the modern rebuild. Every piece of the original preserved — agency
          accounts, ambassador profiles, job postings, applications, the forum — plus the
          conveniences the original never had: verified profiles, in-app messaging, AI matching,
          ratings, calendar sync, rich-media portfolios.
        </p>
        <p>
          One platform. Built for the people running the floor.
        </p>
      </div>

      <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row">
        <Link href={`${site.routes.signup}?role=agency`} className={buttonVariants({ size: "lg" })}>
          Hire ambassadors
        </Link>
        <Link
          href={`${site.routes.signup}?role=talent`}
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Find work
        </Link>
      </div>
    </div>
  );
}
