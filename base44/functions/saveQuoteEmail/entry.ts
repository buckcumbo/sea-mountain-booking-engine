import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest, clientIp } from '../../shared/rateLimit.ts';

// Captures a guest email on an existing Quote row. Called from the booking
// panel the moment a valid email is entered (on blur). Public (no auth):
// quotes are created by anonymous guests, so this uses the service role to
// write the email field (Quote writes are admin-only via RLS).
//
// Abuse guards — this endpoint feeds the hourly recovery-email job, so it
// must not become a way to aim emails at strangers:
//   - per-IP rate limit
//   - only active, unexpired quotes can be tagged
//   - an email already on a quote is never replaced with a different one
//   - constant { ok: true } response regardless of outcome, so callers can't
//     probe which quote IDs exist or already carry emails
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { quoteId, email } = payload;

    if (!quoteId || !email) {
      return Response.json({ error: "quoteId and email are required" }, { status: 400 });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!(await allowRequest(base44, "saveQuoteEmail", clientIp(req), 5, 10))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    let quote: any = null;
    try {
      quote = await base44.asServiceRole.entities.Quote.get(String(quoteId));
    } catch {
      quote = null;
    }

    const active = quote && quote.status === "active" &&
      (!quote.expiresAt || new Date(quote.expiresAt).getTime() > Date.now());
    const sameOrEmpty = quote && (!quote.email || quote.email === cleanEmail);

    if (active && sameOrEmpty) {
      await base44.asServiceRole.entities.Quote.update(String(quoteId), { email: cleanEmail });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[saveQuoteEmail]", error.message);
    return Response.json({ ok: true });
  }
});