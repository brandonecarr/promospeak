import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ConversationListItem } from "@/server/queries/messages";

export function ConversationList({
  conversations,
  basePath,
}: {
  conversations: ConversationListItem[];
  basePath: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No conversations yet. Open a job or an ambassador profile to start one.
      </div>
    );
  }
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`${basePath}/${c.id}`}
            className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/40"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{c.otherName}</p>
                {c.unreadCount > 0 ? (
                  <Badge variant="default">{c.unreadCount} new</Badge>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {c.jobTitle ?? c.otherSubtitle ?? "Direct message"}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {c.lastMessageAt ? formatRelative(c.lastMessageAt) : "—"}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
