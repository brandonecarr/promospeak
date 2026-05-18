"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAvailability, type AvailabilityFormState } from "@/server/actions/availability";

const initialState: AvailabilityFormState = { status: "idle" };
type Kind = "recurring" | "block" | "open";

export function AddAvailabilityForm() {
  const [kind, setKind] = useState<Kind>("recurring");
  const [state, formAction, pending] = useActionState(addAvailability, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "idle" && !pending) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-lg border bg-card p-5">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex gap-2 text-sm">
        <Tab current={kind} value="recurring" onSelect={setKind} label="Recurring weekly" />
        <Tab current={kind} value="block" onSelect={setKind} label="Block date" />
        <Tab current={kind} value="open" onSelect={setKind} label="Open date" />
      </div>

      {kind === "recurring" ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekday">Day</Label>
            <select
              id="weekday"
              name="weekday"
              defaultValue="0"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startTime">Start</Label>
            <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endTime">End</Label>
            <Input id="endTime" name="endTime" type="time" defaultValue="17:00" required />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startTime">Start (optional)</Label>
            <Input id="startTime" name="startTime" type="time" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endTime">End (optional)</Label>
            <Input id="endTime" name="endTime" type="time" />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="e.g. Coachella weekend — out of town" />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add"}
        </Button>
      </div>
    </form>
  );
}

function Tab({
  current,
  value,
  onSelect,
  label,
}: {
  current: Kind;
  value: Kind;
  onSelect: (k: Kind) => void;
  label: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      data-selected={selected}
      className="rounded-md border px-3 py-1.5 text-sm transition data-[selected=true]:border-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background"
    >
      {label}
    </button>
  );
}
