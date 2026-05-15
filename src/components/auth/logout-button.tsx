import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
        Log out
      </Button>
    </form>
  );
}
