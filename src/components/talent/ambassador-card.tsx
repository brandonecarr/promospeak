import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AmbassadorListItem } from "@/server/queries/ambassadors";

export function AmbassadorCard({
  ambassador,
  href,
}: {
  ambassador: AmbassadorListItem;
  href: string;
}) {
  const location = [ambassador.city, ambassador.state].filter(Boolean).join(", ") || "Location TBD";
  return (
    <Link
      href={href}
      className="group block rounded-lg border bg-card p-5 transition hover:border-foreground/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{ambassador.displayName}</h3>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{location}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ambassador.verifiedIdAt ? <Badge variant="default">ID</Badge> : null}
          {ambassador.backgroundCheckStatus === "approved" ? (
            <Badge variant="default">BG</Badge>
          ) : null}
        </div>
      </div>
      {ambassador.headline ? (
        <p className="mt-2 text-sm text-muted-foreground">{ambassador.headline}</p>
      ) : null}
      {(ambassador.skills.length > 0 || ambassador.languages.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {ambassador.languages.slice(0, 3).map((l) => (
            <Badge key={`l-${l}`} variant="secondary">
              {l}
            </Badge>
          ))}
          {ambassador.skills.slice(0, 4).map((s) => (
            <Badge key={`s-${s}`} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
