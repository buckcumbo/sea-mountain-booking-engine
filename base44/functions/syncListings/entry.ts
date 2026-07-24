import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Skeleton: pulls listings from Guesty and upserts them into the Listing entity.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // TODO: const remote = await base44.functions.invoke('guestyFetch', { endpoint: '/listings' });
    //       map remote → Listing schema; bulkCreate / upsert by guesty id.
    const listings = await base44.asServiceRole.entities.Listing.list();
    return Response.json({
      status: 'skeleton',
      message: 'syncListings not yet implemented',
      currentCount: listings.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});