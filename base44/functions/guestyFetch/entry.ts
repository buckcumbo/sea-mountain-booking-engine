import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGuestyConfig } from '../../shared/guesty.ts';

// Skeleton: generic Guesty API fetcher. Accepts { endpoint } and would call the
// Guesty API with a token from guestyAuth. Not yet implemented.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const endpoint = (payload && payload.endpoint) || '/';
    const config = getGuestyConfig();
    // TODO: const token = await base44.functions.invoke('guestyAuth', {});
    //       const res = await fetch(`${config.baseUrl}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
    return Response.json({
      status: 'skeleton',
      message: 'guestyFetch not yet implemented',
      endpoint,
      configured: config.configured,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});