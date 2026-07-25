import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { normalizeRole } from "@/lib/roles";
import NoAccess from "@/components/admin/NoAccess";

// Role-aware guard. allowedRoles defaults to ["admin"].
// - While auth is loading: show a spinner (no redirect).
// - Unauthenticated: redirect to /login with a returnTo param.
// - Staff on an admin-only page: show the NoAccess state (not a redirect loop, not a 404).
// - Role in allowedRoles: render children.
// - Logged-in non-admin (non-staff): redirect to homepage.
export default function AdminGuard({ allowedRoles = ["admin"], children }) {
  const { user, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
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