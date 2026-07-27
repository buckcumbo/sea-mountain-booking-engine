import { Link } from "react-router-dom";
import {
  Waves,
  LayoutDashboard,
  CalendarCheck,
  Building2,
  Compass,
  Users,
  BarChart3,
  Image as ImageIcon,
  Type,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { normalizeRole } from "@/lib/roles";

const ALL_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { to: "/today", label: "Today's Board", icon: CalendarCheck, roles: ["admin", "staff"] },
  { to: "/admin/listings", label: "Listings", icon: Building2, roles: ["admin"] },
  { to: "/admin/guides", label: "Guides", icon: Compass, roles: ["admin"] },
  { to: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
  { to: "/admin/images", label: "Images", icon: ImageIcon, roles: ["admin"] },
  { to: "/admin/copy", label: "Site Copy", icon: Type, roles: ["admin"] },
];

export default function AdminShell({ title, subtitle, children, actions }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const nav = ALL_NAV.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-semibold leading-tight">{title}</h1>
                {subtitle && <p className="text-xs text-primary-foreground/70">{subtitle}</p>}
              </div>
            </div>
            {actions}
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-2 text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg"
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}