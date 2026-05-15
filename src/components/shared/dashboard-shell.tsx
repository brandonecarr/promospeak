import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export type DashboardNavItem = {
  href: string;
  label: string;
};

export function DashboardShell({
  navItems,
  surfaceLabel,
  children,
}: {
  navItems: readonly DashboardNavItem[];
  surfaceLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Link href={site.routes.home} className="text-lg font-semibold tracking-tight">
            {brand.name}
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {surfaceLabel}
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-10">{children}</div>
      </main>
    </div>
  );
}
