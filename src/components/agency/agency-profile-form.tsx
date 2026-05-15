"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAgencyProfile, type ProfileFormState } from "@/server/actions/profiles";

const initialState: ProfileFormState = { status: "idle" };

type Agency = {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  hqCity: string | null;
  hqState: string | null;
  billingEmail: string | null;
};

export function AgencyProfileForm({ agency }: { agency: Agency }) {
  const [state, formAction, pending] = useActionState(updateAgencyProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="agencyId" value={agency.id} />

      <Field
        label="Agency name"
        name="name"
        defaultValue={agency.name}
        required
        error={errorFor(state, "name")}
      />
      <Field
        label="Website"
        name="website"
        type="url"
        defaultValue={agency.website ?? ""}
        placeholder="https://"
        error={errorFor(state, "website")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="HQ city"
          name="hqCity"
          defaultValue={agency.hqCity ?? ""}
          error={errorFor(state, "hqCity")}
        />
        <Field
          label="HQ state"
          name="hqState"
          defaultValue={agency.hqState ?? ""}
          placeholder="CA"
          error={errorFor(state, "hqState")}
        />
      </div>
      <Field
        label="Billing email"
        name="billingEmail"
        type="email"
        defaultValue={agency.billingEmail ?? ""}
        hint="Receipts and invoice notifications go here."
        error={errorFor(state, "billingEmail")}
      />

      <div className="space-y-1.5">
        <Label htmlFor="description">About</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={agency.description ?? ""}
          placeholder="Who you are, the work you do, the activations you've staffed."
          rows={5}
        />
        {errorFor(state, "description") ? (
          <p className="text-xs text-destructive">{errorFor(state, "description")}</p>
        ) : null}
      </div>

      <FormFooter pending={pending} state={state} />
    </form>
  );
}

function FormFooter({
  pending,
  state,
}: {
  pending: boolean;
  state: ProfileFormState;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
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
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function errorFor(state: ProfileFormState, field: string): string | undefined {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[field]?.[0];
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
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
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
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
