export const metadata = { title: "Ambassador overview" };

export default function TalentHome() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Your dashboard</h1>
      <p className="text-muted-foreground">
        Profile, portfolio, applications, and calendar wire up after auth lands.
      </p>
    </div>
  );
}
