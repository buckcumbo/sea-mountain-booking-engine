import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Data-retention pruning, run nightly by the "Data Retention" workflow.
// Deletes records past their retention window, in capped batches:
//   WebhookEvent   > 90 days  (payloads can contain guest PII)
//   AnalyticsEvent > 180 days
//   RateLimitEvent > 2 days   (only needed for its sliding window)
//   Quote          > 90 days, status "expired" only
// Booked quotes, reservations, and profiles are never touched. The per-run cap
// keeps one night's pruning from monopolizing quota — a large backlog simply
// drains over successive nights. Data we no longer hold can't be breached or
// demanded, which is the point.
const BATCH = 500;

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole.entities;
    const targets = [
      { name: 'WebhookEvent', filter: { created_date: { $lt: daysAgo(90) } } },
      { name: 'AnalyticsEvent', filter: { created_date: { $lt: daysAgo(180) } } },
      { name: 'RateLimitEvent', filter: { created_date: { $lt: daysAgo(2) } } },
      { name: 'Quote', filter: { status: 'expired', created_date: { $lt: daysAgo(90) } } },
    ];

    const deleted: Record<string, number> = {};
    for (const t of targets) {
      let count = 0;
      const rows = await svc[t.name].filter(t.filter, 'created_date', BATCH);
      for (const r of Array.isArray(rows) ? rows : []) {
        try {
          await svc[t.name].delete(r.id);
          count++;
        } catch (e) {
          console.error('[pruneOldRecords]', t.name, r.id, e.message);
        }
      }
      deleted[t.name] = count;
    }

    console.log('[pruneOldRecords] done:', JSON.stringify(deleted));
    return Response.json({ ok: true, deleted });
  } catch (error) {
    console.error('[pruneOldRecords]', error.message);
    return Response.json({ error: 'Prune failed' }, { status: 500 });
  }
});