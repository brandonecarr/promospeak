"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { applyToJob, type ApplyFormState } from "@/server/actions/applications";

const initialState: ApplyFormState = { status: "idle" };

export function ApplyForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(applyToJob, initialState);
  return (
    <form action={formAction} className="space-y-3 text-left">
      <input type="hidden" name="jobId" value={jobId} />
      <Textarea
        name="coverNote"
        rows={4}
        placeholder="Optional: a quick note about why you're a good fit."
      />
      {state.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send application"}
      </Button>
    </form>
  );
}
