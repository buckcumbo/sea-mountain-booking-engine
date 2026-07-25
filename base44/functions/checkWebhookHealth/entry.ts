import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Hourly webhook health check, run by the "Webhook Failure Alerts" workflow.
// webhookReceiver records processing failures silently (it must always return
// 200 to the sender) — this is the alarm bell. If any WebhookEvent in the
// last hour has status "failed", every admin gets an email summary. Silent
// webhook failures are the most dangerous kind: nothing visibly breaks until
// a guest hits stale availability, and senders eventually disable endpoints
// that keep failing.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const failedRes = await base44.asServiceRole.entities.WebhookEvent.filter(
      { status: 'failed', created_date: { $gte: oneHourAgo } },
      '-created_date',
      100,
    );
    const failures = Array.isArray(failedRes) ? failedRes : [];
    if (failures.length === 0) {
      return Response.json({ ok: true, failures: 0 });
    }

    const lines = [
      `${failures.length} webhook event(s) failed processing in the last hour.`,
      '',
      ...failures.slice(0, 10).map(
        (f) => `- [${f.eventType || 'unknown'}] ${f.error || 'no error message'} (eventId: ${f.eventId})`,
      ),
    ];
    if (failures.length > 10) lines.push(`...and ${failures.length - 10} more.`);
    lines.push('', 'Where to look: WebhookEvent records in the Data tab, and webhookReceiver function logs.');

    const users = await base44.asServiceRole.entities.User.list('-created_date', 100);
    const admins = (Array.isArray(users) ? users : []).filter((u) => u.role === 'admin' && u.email);

    let notified = 0;
    for (const a of admins) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: a.email,
          subject: `ALERT: ${failures.length} failed webhook event(s) in the last hour`,
          body: lines.join('\n'),
          from_name: 'Sea Mountain Vacations',
        });
        notified++;
      } catch (e) {
        console.error('[checkWebhookHealth] email failed for admin', a.id, e.message);
      }
    }

    return Response.json({ ok: true, failures: failures.length, notified });
  } catch (error) {
    console.error('[checkWebhookHealth]', error.message);
    return Response.json({ error: 'Health check failed' }, { status: 500 });
  }
});