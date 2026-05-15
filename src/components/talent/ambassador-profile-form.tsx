"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { updateAmbassadorProfile, type ProfileFormState } from "@/server/actions/profiles";

const initialState: ProfileFormState = { status: "idle" };

type Ambassador = {
  displayName: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  transport: "none" | "public" | "car";
  willingToTravel: boolean;
  travelRadiusMiles: number | null;
  languages: string[];
  skills: string[];
  hourlyRateMinCents: number | null;
  hourlyRateMaxCents: number | null;
};

export function AmbassadorProfileForm({ ambassador }: { ambassador: Ambassador }) {
  const [state, formAction, pending] = useActionState(updateAmbassadorProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Display name"
        name="displayName"
        defaultValue={ambassador.displayName}
        required
        error={errorFor(state, "displayName")}
      />
      <Field
        label="Headline"
        name="headline"
        defaultValue={ambassador.headline ?? ""}
        placeholder="e.g. Bilingual brand ambassador, NYC + tri-state"
        error={errorFor(state, "headline")}
      />

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={ambassador.bio ?? ""}
          placeholder="Where you've worked, what you're great at, what makes you the right pick."
          rows={5}
        />
        {errorFor(state, "bio") ? (
          <p className="text-xs text-destructive">{errorFor(state, "bio")}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="City"
          name="city"
          defaultValue={ambassador.city ?? ""}
          error={errorFor(state, "city")}
        />
        <Field
          label="State"
          name="state"
          defaultValue={ambassador.state ?? ""}
          placeholder="NY"
          error={errorFor(state, "state")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transport">Transport</Label>
        <select
          id="transport"
          name="transport"
          defaultValue={ambassador.transport}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="none">None</option>
          <option value="public">Public transit</option>
          <option value="car">Car</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="willingToTravel"
            name="willingToTravel"
            defaultChecked={ambassador.willingToTravel}
          />
          <Label htmlFor="willingToTravel" className="text-sm">
            Willing to travel
          </Label>
        </div>
        <Field
          label="Travel radius (mi)"
          name="travelRadiusMiles"
          type="number"
          defaultValue={ambassador.travelRadiusMiles?.toString() ?? ""}
          placeholder="e.g. 50"
          error={errorFor(state, "travelRadiusMiles")}
        />
      </div>

      <Field
        label="Languages"
        name="languages"
        defaultValue={ambassador.languages.join(", ")}
        placeholder="English, Spanish"
        hint="Comma-separated."
        error={errorFor(state, "languages")}
      />
      <Field
        label="Skills"
        name="skills"
        defaultValue={ambassador.skills.join(", ")}
        placeholder="Sampling, Hosting, Demo, Cash handling"
        hint="Comma-separated."
        error={errorFor(state, "skills")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Hourly rate min (¢)"
          name="hourlyRateMinCents"
          type="number"
          defaultValue={ambassador.hourlyRateMinCents?.toString() ?? ""}
          placeholder="e.g. 2500 = $25.00/hr"
          hint="In cents. Skip if flexible."
          error={errorFor(state, "hourlyRateMinCents")}
        />
        <Field
          label="Hourly rate max (¢)"
          name="hourlyRateMaxCents"
          type="number"
          defaultValue={ambassador.hourlyRateMaxCents?.toString() ?? ""}
          placeholder="e.g. 5000 = $50.00/hr"
          error={errorFor(state, "hourlyRateMaxCents")}
        />
      </div>

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
    </form>
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
