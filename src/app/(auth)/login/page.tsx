import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log in" };

type Search = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Search) {
  const { error } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to your agency or ambassador account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
