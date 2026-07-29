import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest, clientIp } from '../../shared/rateLimit.ts';

// Public, honest social proof for a listing page: how many distinct guest
// sessions viewed this home in the last 24 hours, from our own
// AnalyticsEvent rows (RLS keeps those admin-only, hence this endpoint).
// Returns { views: 0 } unless at least MIN_SESSIONS real sessions looked —
// the brand rule is that scarcity/interest claims must be literally true,
// so a number too small to be meaningful is simply not shown.

const MIN_SESSIONS = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const slug = String(payload.slug || "").trim();
    if (!slug || slug.length > 120 || !/^[a-z0-9-]+$/.test(slug)) {
      return Response.json({ error: "Invalid slug" }, { status: 400 });
    }

    const ip = clientIp(req);
    if (!(await allowRequest(base44, "getListingBuzz", ip, 30, 10))) {
      return Response.json({ views: 0 });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const events = await base44.asServiceRole.entities.AnalyticsEvent.filter(
      { eventType: "listing_view", listingSlug: slug, created_date: { $gte: since } },
      "-created_date",
      500,
    );
    const sessions = new Set(
      (Array.isArray(events) ? events : []).map((e: any) => e.sessionId).filter(Boolean),
    );
    const views = sessions.size;
    return Response.json({ views: views >= MIN_SESSIONS ? views : 0 });
  } catch {
    // Social proof is decoration — never let it error a listing page.
    return Response.json({ views: 0 });
  }
});
