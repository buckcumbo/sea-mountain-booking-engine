import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGuestyConfig } from '../../shared/guesty.ts';

// Skeleton: obtains a Guesty API access token (OAuth2 client-credentials flow).
// Not yet implemented — returns config status so callers can degrade gracefully.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const config = getGuestyConfig();
    // TODO: POST {config.baseUrl}/auth/token with Basic auth (apiKey:apiSecret) → access_token.
    return Response.json({
      status: 'skeleton',
      message: 'guestyAuth token exchange not yet implemented',
      configured: config.configured,
      baseUrl: config.baseUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});