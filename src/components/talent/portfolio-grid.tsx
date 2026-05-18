import Image from "next/image";
import type { MediaItem } from "@/server/queries/media";

export function PortfolioGrid({
  media,
  action,
}: {
  media: MediaItem[];
  action?: (item: MediaItem) => React.ReactNode;
}) {
  if (media.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        No portfolio items yet.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {media.map((m) => (
        <figure key={m.id} className="overflow-hidden rounded-lg border bg-card">
          <div className="relative aspect-video bg-muted">
            {m.type === "video" ? (
              <video
                src={m.url}
                poster={m.thumbnailUrl ?? undefined}
                controls
                playsInline
                className="size-full object-cover"
              />
            ) : (
              <Image
                src={m.url}
                alt={m.caption ?? m.brandTag ?? "Portfolio image"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <figcaption className="space-y-1 p-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {m.brandTag ? <strong className="text-foreground">{m.brandTag}</strong> : null}
                {m.roleTag ? <span> • {m.roleTag}</span> : null}
              </span>
              {m.year ? <span>{m.year}</span> : null}
            </div>
            {m.caption ? <p className="text-foreground">{m.caption}</p> : null}
            {action ? <div className="pt-1">{action(m)}</div> : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
