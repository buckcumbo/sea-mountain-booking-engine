import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { normalizeRole } from "@/lib/roles";
import Seo from "@/components/Seo";
import AdminShell from "@/components/admin/AdminShell";

const ROLE_LABELS = {
  admin: "Admin",
  staff: "Staff",
  guest: "Guest",
};

const ROLE_BADGE_CLASSES = {
  admin: "bg-coast-navy text-white",
  staff: "bg-coast-ocean text-white",
  guest: "bg-muted text-muted-foreground",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.User.list("-created_date", 500);
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (userId, newRole) => {
    if (
      !window.confirm(
        `Change this user's role to ${ROLE_LABELS[newRole]}? This takes effect on their next page load.`
      )
    )
      return;
    setUpdating(userId);
    try {
      await base44.entities.User.update(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast({
        title: "Role updated",
        description: `User is now ${ROLE_LABELS[newRole]}.`,
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminShell title="Users" subtitle={`${users.length} total users`}>
      <Seo title="Users | Admin" path="/admin/users" robots="noindex,nofollow" />
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Email</th>
                <th className="text-left font-medium px-4 py-3">Role</th>
                <th className="text-left font-medium px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const role = normalizeRole(u.role);
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">
                        {u.full_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${ROLE_BADGE_CLASSES[role]}`}
                          >
                            {ROLE_LABELS[role]}
                          </span>
                          <select
                            value={role}
                            disabled={isSelf || updating === u.id}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className="h-8 rounded-lg border border-border bg-card text-sm px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="guest">Guest</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(u.created_date)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}