import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Captures a guest email on an existing Quote row. Called from the booking
// panel the moment a valid email is entered (on blur). Public (no auth):
// quotes are created by anonymous guests, so this uses the service role to
// write the email field (Quote writes are admin-only via RLS). The UI fails
// silently on any error.
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

    await base44.asServiceRole.entities.Quote.update(String(quoteId), { email: cleanEmail });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});