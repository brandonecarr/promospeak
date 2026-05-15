"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { saveJob, type JobFormState } from "@/server/actions/jobs";

const initialState: JobFormState = { status: "idle" };

type JobDefaults = {
  id?: string;
  title?: string;
  description?: string;
  roleType?: string;
  city?: string;
  state?: string;
  venueName?: string | null;
  startAt?: Date | string;
  endAt?: Date | string;
  payRateCents?: number;
  payBasis?: "hour" | "flat" | "day";
  dressCode?: string | null;
  requirements?: string[];
  headcountNeeded?: number;
  requiresVerifiedId?: boolean;
  requiresBackgroundCheck?: boolean;
};

export function JobForm({ defaults }: { defaults?: JobDefaults }) {
  const [state, formAction, pending] = useActionState(saveJob, initialState);
  const [intent, setIntent] = useState<"draft" | "open">("open");

  return (
    <form action={formAction} className="space-y-6">
      {defaults?.id ? <input type="hidden" name="jobId" value={defaults.id} /> : null}
      <input type="hidden" name="intent" value={intent} />

      <Field
        label="Title"
        name="title"
        defaultValue={defaults?.title ?? ""}
        required
        placeholder="e.g. Brand ambassador — Coachella weekend 2 activation"
        error={errorFor(state, "title")}
      />

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={6}
          defaultValue={defaults?.description ?? ""}
          placeholder="What's the activation, what's the role, what does a good shift look like."
          aria-invalid={errorFor(state, "description") ? "true" : undefined}
        />
        {errorFor(state, "description") ? (
          <p className="text-xs text-destructive">{errorFor(state, "description")}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Role type"
          name="roleType"
          defaultValue={defaults?.roleType ?? ""}
          required
          placeholder="Sampling, Demo, Host, Street team…"
          error={errorFor(state, "roleType")}
        />
        <Field
          label="Headcount needed"
          name="headcountNeeded"
          type="number"
          defaultValue={defaults?.headcountNeeded?.toString() ?? "1"}
          required
          error={errorFor(state, "headcountNeeded")}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="City"
          name="city"
          defaultValue={defaults?.city ?? ""}
          required
          error={errorFor(state, "city")}
        />
        <Field
          label="State"
          name="state"
          defaultValue={defaults?.state ?? ""}
          required
          placeholder="CA"
          error={errorFor(state, "state")}
        />
        <Field
          label="Venue (optional)"
          name="venueName"
          defaultValue={defaults?.venueName ?? ""}
          error={errorFor(state, "venueName")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Start"
          name="startAt"
          type="datetime-local"
          defaultValue={toDatetimeLocal(defaults?.startAt)}
          required
          error={errorFor(state, "startAt")}
        />
        <Field
          label="End"
          name="endAt"
          type="datetime-local"
          defaultValue={toDatetimeLocal(defaults?.endAt)}
          required
          error={errorFor(state, "endAt")}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="Pay rate (¢)"
          name="payRateCents"
          type="number"
          defaultValue={defaults?.payRateCents?.toString() ?? ""}
          required
          placeholder="2500 = $25.00"
          hint="In cents."
          error={errorFor(state, "payRateCents")}
        />
        <div className="space-y-1.5">
          <Label htmlFor="payBasis">Pay basis</Label>
          <select
            id="payBasis"
            name="payBasis"
            defaultValue={defaults?.payBasis ?? "hour"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="hour">Hourly</option>
            <option value="flat">Flat</option>
            <option value="day">Daily</option>
          </select>
        </div>
        <Field
          label="Dress code"
          name="dressCode"
          defaultValue={defaults?.dressCode ?? ""}
          placeholder="All black, brand tee provided…"
          error={errorFor(state, "dressCode")}
        />
      </div>

      <Field
        label="Requirements"
        name="requirements"
        defaultValue={defaults?.requirements?.join(", ") ?? ""}
        placeholder="21+, Bilingual, Comfortable on camera"
        hint="Comma-separated."
        error={errorFor(state, "requirements")}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="requiresVerifiedId"
            name="requiresVerifiedId"
            defaultChecked={defaults?.requiresVerifiedId}
          />
          <Label htmlFor="requiresVerifiedId" className="text-sm">
            Requires verified ID
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="requiresBackgroundCheck"
            name="requiresBackgroundCheck"
            defaultChecked={defaults?.requiresBackgroundCheck}
          />
          <Label htmlFor="requiresBackgroundCheck" className="text-sm">
            Requires background check
          </Label>
        </div>
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          onClick={() => setIntent("draft")}
        >
          Save draft
        </Button>
        <Button type="submit" disabled={pending} onClick={() => setIntent("open")}>
          {pending ? "Saving…" : "Publish"}
        </Button>
      </div>
    </form>
  );
}

function toDatetimeLocal(value: Date | string | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function errorFor(state: JobFormState, field: string): string | undefined {
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
