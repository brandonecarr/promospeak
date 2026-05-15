import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href={site.routes.home} className="text-lg font-semibold tracking-tight">
            {brand.name}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
