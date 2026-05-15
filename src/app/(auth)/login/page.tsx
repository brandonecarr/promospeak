import Link from "next/link";
import { site } from "@/config/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Auth form lands here in the first vertical slice.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link href={site.routes.signup} className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
