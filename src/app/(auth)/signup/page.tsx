import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Sign up" };

type Search = { searchParams: Promise<{ role?: string }> };

export default async function SignupPage({ searchParams }: Search) {
  const { role } = await searchParams;
  const initialRole = role === "agency" ? "agency_member" : "ambassador";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join PromoSpeak</CardTitle>
        <CardDescription>
          Agencies post gigs. Ambassadors build portfolios that travel with them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm initialRole={initialRole} />
      </CardContent>
    </Card>
  );
}
