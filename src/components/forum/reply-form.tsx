"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToThread, type ForumFormState } from "@/server/actions/forum";

const initialState: ForumFormState = { status: "idle" };

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, formAction, pending] = useActionState(replyToThread, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "idle" && !pending) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea name="body" rows={5} placeholder="Write a reply…" required />
      {state.status === "error" ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
