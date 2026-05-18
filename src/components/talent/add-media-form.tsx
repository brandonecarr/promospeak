"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMedia, type MediaFormState } from "@/server/actions/media";

const initialState: MediaFormState = { status: "idle" };

export function AddMediaForm() {
  const [state, formAction, pending] = useActionState(addMedia, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "idle" && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border bg-card p-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue="image"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://…"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="brandTag">Brand</Label>
          <Input id="brandTag" name="brandTag" placeholder="e.g. Pepsi" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roleTag">Role</Label>
          <Input id="roleTag" name="roleTag" placeholder="e.g. Sampling lead" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" placeholder="2026" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="caption">Caption</Label>
        <Input id="caption" name="caption" placeholder="One-line context" />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add to portfolio"}
        </Button>
      </div>
    </form>
  );
}
