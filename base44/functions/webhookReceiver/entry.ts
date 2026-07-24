// Public webhook receiver for Guesty events. No auth — logs the payload and returns 200.
Deno.serve(async (req) => {
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload: unknown = null;
    if (contentType.includes('application/json')) {
      try { payload = await req.json(); } catch { payload = null; }
    } else {
      try { payload = await req.text(); } catch { payload = null; }
    }
    console.log('[webhookReceiver] received:', JSON.stringify(payload));
    // TODO: verify Guesty webhook signature, then route the event to syncListings / syncCalendars.
    return Response.json({ received: true, status: 'ok' }, { status: 200 });
  } catch (error) {
    console.log('[webhookReceiver] error:', error.message);
    return Response.json({ received: true, status: 'ok' }, { status: 200 });
  }
});