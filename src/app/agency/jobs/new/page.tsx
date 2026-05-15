import { requireRole } from "@/lib/auth/roles";
import { JobForm } from "@/components/agency/job-form";

export const metadata = { title: "New job" };

export default async function NewJobPage() {
  await requireRole(["agency_member", "admin"]);
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New job</h1>
        <p className="mt-1 text-muted-foreground">
          Save as draft to keep iterating, or publish to put it in front of ambassadors.
        </p>
      </div>
      <JobForm />
    </div>
  );
}
