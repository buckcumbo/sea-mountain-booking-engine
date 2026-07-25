import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { normalizeRole } from "@/lib/roles";
import NoAccess from "@/components/admin/NoAccess";

// Role-aware guard. allowedRoles defaults to ["admin"].
// - Unauthenticated or guest: redirect to homepage.
// - Staff on an admin-only page: show the NoAccess state (not a redirect loop, not a 404).
// - Role in allowedRoles: render children.
export default function AdminGuard({ allowedRoles = ["admin"], children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const role = normalizeRole(user.role);

  if (allowedRoles.includes(role)) {
    return children;
  }

  if (role === "staff") {
    return <NoAccess />;
  }

  return <Navigate to="/" replace />;
}