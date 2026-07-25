import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Sends abandoned-quote recovery emails. Runs on an hourly scheduled workflow.
// Auth: admin-only. Scheduled workflow invocations carry an admin context (per
// the platform model), so they pass; non-admin manual callers are rejected.
//
// DELIVERY NOTE: the built-in Core.SendEmail integration reaches REGISTERED
// APP USERS ONLY. Prospective guest emails on quotes are usually not
// registered app users, so sends to those addresses are rejected. For real
// delivery to arbitrary guest emails, wire a transactional provider (e.g.
// Resend) via a backend function with an API key. recoveryEmailSentAt is set
// only after a successful send call.

const SITE_ORIGIN = "https://www.seamountainvacations.com";
const PHONE = "(843) 890-2094";

function fmtMoney(n) {
  return "$" + Number(n || 0);
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Friendly Eastern Time date and time. No em dashes anywhere.
function fmtFriendlyDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    const dateFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const timeFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateFmt.format(d)} at ${timeFmt.format(d)} ET`;
  } catch {
    return d.toLocaleString("en-US");
  }
}

// Invoice line items and total rendered verbatim from the stored invoice.
// No amount is ever recomputed here.
function buildEmailBody({ firstName, listingTitle, checkIn, checkOut, guests, invoice, expiresAt, linkUrl }) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const lockUntil = fmtFriendlyDateTime(expiresAt);

  const rows = (invoice?.lineItems || []).map((li) =>
    `<tr><td style="padding:6px 0;color:#475569;font-size:14px;">${escapeHtml(li.label)}</td>` +
    `<td style="padding:6px 0;text-align:right;color:#0f172a;font-size:14px;font-weight:500;white-space:nowrap;">${fmtMoney(li.amount)}</td></tr>`
  ).join("");

  const subtotalRow = invoice?.subtotal != null
    ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Subtotal</td>` +
      `<td style="padding:6px 0;text-align:right;color:#334155;font-size:14px;">${fmtMoney(invoice.subtotal)}</td></tr>`
    : "";

  const totalRow = invoice?.total != null
    ? `<tr><td style="padding:12px 0 0;border-top:1px solid #e2e8f0;color:#0f172a;font-size:15px;font-weight:600;">Total</td>` +
      `<td style="padding:12px 0 0;border-top:1px solid #e2e8f0;text-align:right;color:#0f172a;font-size:18px;font-weight:600;white-space:nowrap;">${fmtMoney(invoice.total)}</td></tr>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <tr><td style="padding:28px 32px 8px 32px;">
          <p style="margin:0 0 4px 0;color:#17304f;font-size:13px;font-weight:600;letter-spacing:0.06em;">SEA MOUNTAIN VACATIONS</p>
        </td></tr>
        <tr><td style="padding:8px 32px 28px 32px;">
          <p style="margin:0 0 16px 0;color:#0f172a;font-size:16px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.6;">
            Your quote for ${escapeHtml(listingTitle)}, ${escapeHtml(checkIn)} to ${escapeHtml(checkOut)} for ${escapeHtml(guests)} guests, is saved. The price is locked until ${escapeHtml(lockUntil)}.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 24px 0;">
            ${rows}
            ${subtotalRow}
            ${totalRow}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
            <tr><td style="background:#17304f;border-radius:10px;">
              <a href="${escapeHtml(linkUrl)}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Pick up where you left off</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">Questions? Call us at <a href="tel:${PHONE.replace(/[^0-9+]/g, "")}" style="color:#17304f;text-decoration:none;">${PHONE}</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const nowIso = now.toISOString();
    const oneHourAgoMs = now.getTime() - 60 * 60 * 1000;
    const oneHourAheadIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    // a. Mark stale active quotes as expired. These are never emailed.
    const stale = await base44.asServiceRole.entities.Quote.filter(
      { status: "active", expiresAt: { $lt: nowIso } },
      "-created_date",
      500,
    );
    const expiredCount = Array.isArray(stale) ? stale.length : 0;
    if (expiredCount > 0) {
      await base44.asServiceRole.entities.Quote.updateMany(
        { status: "active", expiresAt: { $lt: nowIso } },
        { $set: { status: "expired" } },
      );
    }

    // b. Find recovery candidates: active, email set, not yet sent, older than
    //    1 hour, and with at least 1 hour left before expiry.
    const pool = await base44.asServiceRole.entities.Quote.filter(
      { status: "active", expiresAt: { $gte: oneHourAheadIso } },
      "-created_date",
      500,
    );
    const candidates = (Array.isArray(pool) ? pool : []).filter((q) => {
      const email = q.email;
      if (!email || typeof email !== "string" || email.trim() === "") return false;
      if (q.recoveryEmailSentAt) return false;
      const created = new Date(q.created_date).getTime();
      if (isNaN(created) || created > oneHourAgoMs) return false;
      return true;
    }).slice(0, 25);

    let emailed = 0;
    let skipped = 0;

    for (const q of candidates) {
      try {
        // Load the listing for the title + slug.
        let listing: any = null;
        if (q.listingId) {
          try {
            listing = await base44.asServiceRole.entities.Listing.get(String(q.listingId));
          } catch { listing = null; }
        }
        const listingTitle = listing?.title || "your stay";
        const listingSlug = listing?.slug || listing?.id || q.listingId || "";
        const linkUrl = `${SITE_ORIGIN}/listing/${listingSlug}?quoteId=${q.id}`;

        // First name, if we have it on a GuestProfile.
        let firstName = "";
        if (q.email) {
          try {
            const gps = await base44.asServiceRole.entities.GuestProfile.filter(
              { email: q.email },
              "-created_date",
              1,
            );
            if (gps && gps.length > 0 && gps[0].firstName) firstName = gps[0].firstName;
          } catch { /* no profile, use default greeting */ }
        }

        const subject = `Your quote for ${listingTitle} is saved`;
        const body = buildEmailBody({
          firstName,
          listingTitle,
          checkIn: q.checkIn,
          checkOut: q.checkOut,
          guests: q.guests,
          invoice: q.invoice,
          expiresAt: q.expiresAt,
          linkUrl,
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: q.email,
          subject,
          body,
          from_name: "Sea Mountain Vacations",
        });

        // Mark sent only after a successful send. Never send twice.
        await base44.asServiceRole.entities.Quote.update(q.id, {
          recoveryEmailSentAt: nowIso,
        });
        emailed++;
      } catch (e) {
        console.error("[sendQuoteRecoveryEmails] failed for quote", q.id, e.message);
        skipped++;
      }
    }

    return Response.json({ expired: expiredCount, emailed, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});