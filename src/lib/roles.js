// Single source of truth for role normalization.
// Legacy "user" role (pre-existing accounts) is treated as "guest".
export function normalizeRole(role) {
  if (role === "admin") return "admin";
  if (role === "staff") return "staff";
  return "guest";
}