export const metadata = { title: "Admin" };

export default function AdminHome() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">PromoSpeak admin</h1>
      <p className="text-muted-foreground">
        Verifications, forum moderation, and dispute resolution land here. Gate via admin role check
        in middleware before any UI is wired.
      </p>
    </div>
  );
}
