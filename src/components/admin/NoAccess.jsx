import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown when a staff user visits an admin-only page (not a redirect, not a 404).
export default function NoAccess() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-5">
          <ShieldAlert className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-xl font-semibold mb-2">
          You don't have access to this page
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Your role doesn't include this area. Head back to the dashboard for
          what you can manage.
        </p>
        <Button asChild>
          <Link to="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}