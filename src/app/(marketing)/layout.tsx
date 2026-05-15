import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={site.routes.home} className="text-lg font-semibold tracking-tight">
            {brand.name}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href={site.routes.publicJobs} className="text-muted-foreground hover:text-foreground">
              Jobs
            </Link>
            <Link href={site.routes.publicAmbassadors} className="text-muted-foreground hover:text-foreground">
              Ambassadors
            </Link>
            <Link href={site.routes.forum} className="text-muted-foreground hover:text-foreground">
              Forum
            </Link>
            <Link href={site.routes.pricing} className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href={site.routes.login} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link href={site.routes.signup} className={buttonVariants({ size: "sm" })}>
              Sign up
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {brand.legalName}
          </span>
          <nav className="flex gap-4">
            <Link href={site.routes.about} className="hover:text-foreground">
              About
            </Link>
            <Link href={site.routes.contact} className="hover:text-foreground">
              Contact
            </Link>
            <Link href={site.routes.legal.terms} className="hover:text-foreground">
              Terms
            </Link>
            <Link href={site.routes.legal.privacy} className="hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
