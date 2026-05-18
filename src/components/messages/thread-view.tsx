import { cn } from "@/lib/utils";
import type { MessageEntry } from "@/server/queries/messages";

export function ThreadView({
  messages,
  currentUserId,
}: {
  messages: MessageEntry[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
        No messages yet — start the thread.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((m) => {
        const mine = m.senderUserId === currentUserId;
        return (
          <li
            key={m.id}
            className={cn("flex", mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                mine
                  ? "bg-foreground text-background"
                  : "border bg-card text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  mine ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(m.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
