// Sliding-window rate limiter backed by the RateLimitEvent entity.
// Used by the public, unauthenticated endpoints (createQuote, saveQuoteEmail,
// bookReservation, submitInquiry) — anonymous guests must be able to call
// them, so per-IP counting is the abuse guard.
//
// allowRequest returns true when the caller is within the limit (and records
// the hit), false when the limit is exceeded (nothing written). It FAILS OPEN:
// a rate-limiter outage must never take down the booking flow.

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function allowRequest(
  base44,
  action: string,
  key: string,
  limit: number,
  windowMinutes: number,
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const recent = await base44.asServiceRole.entities.RateLimitEvent.filter(
      { action, key, created_date: { $gte: since } },
      "-created_date",
      limit,
    );
    if (Array.isArray(recent) && recent.length >= limit) return false;
    await base44.asServiceRole.entities.RateLimitEvent.create({ action, key });
    return true;
  } catch (e) {
    console.error("[rateLimit] fail-open:", action, e.message);
    return true;
  }
}