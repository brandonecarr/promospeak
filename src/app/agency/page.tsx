export const metadata = { title: "Agency overview" };

export default function AgencyHome() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Agency dashboard</h1>
      <p className="text-muted-foreground">
        Auth, agency profile, jobs, and applicants ship in the first vertical slice.
      </p>
    </div>
  );
}
