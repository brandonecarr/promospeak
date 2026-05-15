import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <div>
      <section className="container mx-auto px-4 pb-24 pt-20 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            The home of experiential marketing
          </p>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            {brand.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Agencies post {brand.copy.gigNounPlural}. {brand.copy.talentNounPlural} build portfolios that travel with them. One place. Built for the people running the floor.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={`${site.routes.signup}?role=agency`} className={buttonVariants({ size: "lg" })}>
              Hire ambassadors
            </Link>
            <Link href={`${site.routes.signup}?role=talent`} className={buttonVariants({ size: "lg", variant: "outline" })}>
              Find work
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto grid gap-12 px-4 py-20 md:grid-cols-3">
          <Feature
            title="Built for activations"
            body="Sampling, demos, trade shows, mobile tours, street teams. Job posts speak the language of the work."
          />
          <Feature
            title="Portfolios that follow the talent"
            body="One profile, every agency. Photos, video, verified ID, ratings — the reputation comes with you."
          />
          <Feature
            title="The forum, reborn"
            body="The original EventSpeak was the industry's hangout. The forum is here, and it's not a side feature."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground">{body}</p>
    </div>
  );
}
