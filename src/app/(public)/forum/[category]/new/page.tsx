import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCategoryBySlug } from "@/server/queries/forum";
import { requireUser } from "@/lib/auth/roles";
import { site } from "@/config/site";
import { NewThreadForm } from "@/components/forum/new-thread-form";

export const metadata = { title: "New thread" };

type Params = { params: Promise<{ category: string }> };

export default async function NewThreadPage({ params }: Params) {
  await requireUser();
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  if (cat.isLocked) redirect(`${site.routes.forum}/${cat.slug}`);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Link
        href={`${site.routes.forum}/${cat.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {cat.name}
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">New thread in {cat.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Be kind, be useful, be yourself. Moderators reserve the right to clean things up.
      </p>
      <div className="mt-6">
        <NewThreadForm categorySlug={cat.slug} />
      </div>
    </div>
  );
}
