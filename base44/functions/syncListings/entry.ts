import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { upsertListingByGuestyId } from '../../shared/upserts.ts';

// Pulls listings from Guesty and upserts them into the Listing entity by guestyId (unique).
// Until guestyFetch returns real Guesty data, callers may pass { listings: [...] } to exercise the upsert.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }

    const incoming = Array.isArray(payload?.listings) ? payload.listings : [];
    let upserted = 0;
    for (const l of incoming) {
      if (!l?.guestyId) continue;
      await upsertListingByGuestyId(base44, l);
      upserted++;
    }

    const listings = await base44.asServiceRole.entities.Listing.list();
    return Response.json({
      status: incoming.length ? 'upserted' : 'skeleton',
      message: incoming.length
        ? `${upserted} listings upserted by guestyId`
        : 'syncListings awaiting Guesty data; pass { listings: [...] } to upsert',
      upserted,
      currentCount: listings.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});