"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createThread, type ForumFormState } from "@/server/actions/forum";

const initialState: ForumFormState = { status: "idle" };

export function NewThreadForm({ categorySlug }: { categorySlug: string }) {
  const [state, formAction, pending] = useActionState(createThread, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={5} />
        {state.status === "error" && state.fieldErrors?.title?.[0] ? (
          <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" name="body" required rows={10} />
        {state.status === "error" && state.fieldErrors?.body?.[0] ? (
          <p className="text-xs text-destructive">{state.fieldErrors.body[0]}</p>
        ) : null}
      </div>
      {state.status === "error" && !state.fieldErrors ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post thread"}
      </Button>
    </form>
  );
}
