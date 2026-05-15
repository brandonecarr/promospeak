"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthFormState } from "@/server/actions/auth";
import { site } from "@/config/site";

const initialState: AuthFormState = { status: "idle" };

type Role = "agency_member" | "ambassador";

export function SignupForm({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <RoleToggle current={role} value="agency_member" onSelect={setRole}>
          I&apos;m an agency
        </RoleToggle>
        <RoleToggle current={role} value="ambassador" onSelect={setRole}>
          I&apos;m an ambassador
        </RoleToggle>
      </div>
      <input type="hidden" name="role" value={role} />

      {role === "agency_member" ? (
        <Field
          label="Agency name"
          name="organizationName"
          required
          autoComplete="organization"
          error={state.status === "error" ? state.fieldErrors?.organizationName?.[0] : undefined}
        />
      ) : null}

      <Field
        label={role === "agency_member" ? "Your name" : "Display name"}
        name="displayName"
        required
        autoComplete="name"
        error={state.status === "error" ? state.fieldErrors?.displayName?.[0] : undefined}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        error={state.status === "error" ? state.fieldErrors?.email?.[0] : undefined}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="8 characters minimum."
        error={state.status === "error" ? state.fieldErrors?.password?.[0] : undefined}
      />

      {state.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-foreground" role="status">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={site.routes.login} className="font-medium text-foreground hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function RoleToggle({
  current,
  value,
  onSelect,
  children,
}: {
  current: Role;
  value: Role;
  onSelect: (role: Role) => void;
  children: React.ReactNode;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      data-selected={selected}
      className="rounded-md border px-3 py-2 text-sm transition data-[selected=true]:border-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background"
    >
      {children}
    </button>
  );
}
