import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Emails every admin User when a new Inquiry is created. Triggered by the
// "Inquiry Alerts" entity-trigger workflow (which passes the inquiryId).
// Admin-gated to prevent direct-call spam. Admin users are registered app
// users, so Core.SendEmail can deliver to them.
const SITE_ORIGIN = "https://www.seamountainvacations.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { inquiryId } = payload;
    if (!inquiryId) {
      return Response.json({ error: "inquiryId is required" }, { status: 400 });
    }

    let inquiry: any = null;
    try {
      inquiry = await base44.asServiceRole.entities.Inquiry.get(String(inquiryId));
    } catch {
      return Response.json({ error: "Inquiry not found" }, { status: 404 });
    }
    if (!inquiry) {
      return Response.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const who = inquiry.name || inquiry.email || "a guest";
    const subject = `New inquiry: ${who}`;

    const lines = [
      "New inquiry received.",
      "",
      `Name: ${inquiry.name || "Not provided"}`,
      `Email: ${inquiry.email || "Not provided"}`,
      `Phone: ${inquiry.phone || "Not provided"}`,
    ];
    if (inquiry.type) lines.push(`Type: ${inquiry.type}`);
    if (inquiry.propertyAddress) lines.push(`Property: ${inquiry.propertyAddress}`);
    lines.push("", "Message:", inquiry.message || "(no message)", "", `View in admin: ${SITE_ORIGIN}/admin`);

    const body = lines.join("\n");

    const users = await base44.asServiceRole.entities.User.list("-created_date", 100);
    const admins = (Array.isArray(users) ? users : []).filter((u) => u.role === "admin" && u.email);

    let sent = 0;
    for (const a of admins) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: a.email,
          subject,
          body,
          from_name: "Sea Mountain Vacations",
        });
        sent++;
      } catch (e) {
        console.error("[sendInquiryAlerts] failed for admin", a.id, e.message);
      }
    }

    return Response.json({ sent, admins: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});