import Link from "next/link";
import { site } from "@/config/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Sign up" };

type Search = { searchParams: Promise<{ role?: string }> };

export default async function SignupPage({ searchParams }: Search) {
  const { role } = await searchParams;
  const initialRole = role === "agency" || role === "talent" ? role : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join PromoSpeak</CardTitle>
        <CardDescription>Tell us who you are. Auth wires up in the first vertical slice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`${site.routes.signup}?role=agency`}
            className={buttonVariants({ variant: initialRole === "agency" ? "default" : "outline" })}
          >
            I&apos;m an agency
          </Link>
          <Link
            href={`${site.routes.signup}?role=talent`}
            className={buttonVariants({ variant: initialRole === "talent" ? "default" : "outline" })}
          >
            I&apos;m an ambassador
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={site.routes.login} className="font-medium text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
