import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public XML sitemap generator. Serves indexable public URLs only — excludes
// noindex routes (favorites, my-trips, admin, today, auth, checkout). Reads
// ONLY local Listing + AreaGuide entities as the service role (no external calls).
const SITE_ORIGIN = "https://www.seamountainvacations.com";
const AREA_SLUGS = [
  "north-myrtle-beach",
  "myrtle-beach",
  "surfside",
  "garden-city",
  "murrells-inlet",
  "pawleys-island",
];
const COLLECTION_SLUGS = [
  "oceanfront",
  "pet-friendly",
  "poolside",
  "channel-homes",
  "budget-friendly",
  "the-100-collection",
  "family",
  "marshfront",
];
const STATIC_PATHS = [
  "/", "/search", "/guides", "/collections",
  "/about", "/contact", "/list-your-property", "/special-offers",
  "/privacy", "/terms",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [listings, guides] = await Promise.all([
      base44.asServiceRole.entities.Listing.list("-created_date", 500),
      base44.asServiceRole.entities.AreaGuide.filter(
        { type: "guide", published: true },
        "-created_date",
        500,
      ),
    ]);

    const today = new Date().toISOString();
    const urls = [];

    const push = (path, changefreq, priority) => {
      urls.push({
        loc: `${SITE_ORIGIN}${path === "/" ? "" : path}`,
        lastmod: today,
        changefreq,
        priority,
      });
    };

    STATIC_PATHS.forEach((p) =>
      push(p, "weekly", p === "/" ? "1.0" : "0.7")
    );
    AREA_SLUGS.forEach((s) => push(`/area/${s}`, "weekly", "0.8"));
    COLLECTION_SLUGS.forEach((s) => push(`/collections/${s}`, "weekly", "0.7"));

    (listings || []).forEach((l) => {
      if (l.active === false) return;
      const slug = l.slug || l.id;
      if (!slug) return;
      push(`/listing/${slug}`, "weekly", "0.9");
    });

    (guides || []).forEach((g) => {
      if (!g.slug) return;
      push(`/guides/${g.slug}`, "weekly", "0.6");
    });

    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url>\n` +
            `    <loc>${escapeXml(u.loc)}</loc>\n` +
            `    <lastmod>${u.lastmod}</lastmod>\n` +
            `    <changefreq>${u.changefreq}</changefreq>\n` +
            `    <priority>${u.priority}</priority>\n` +
            `  </url>`
        )
        .join("\n") +
      `\n</urlset>\n`;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === "&" ? "&amp;" :
    c === "'" ? "&apos;" : "&quot;"
  );
}