import { useEffect } from "react";
import {
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  canonicalUrl,
} from "@/lib/seo";

// Site-wide SEO head manager. Pass a title, description, canonical path
// (e.g. "/search" — query strings are dropped), a robots directive, optional
// Open Graph image/type, and JSON-LD (object or array). Returns null.
export default function Seo({
  title,
  description = "",
  path = "/",
  robots = "index,follow",
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd,
}) {
  useEffect(() => {
    const url = canonicalUrl(path);
    document.title = title;

    // Clear prior SEO-managed tags and stale <head> defaults to avoid duplicates.
    document.querySelectorAll("[data-seo]").forEach((el) => el.remove());
    document
      .querySelectorAll(
        'meta[name="description"]:not([data-seo]), link[rel="canonical"]:not([data-seo]), meta[name="robots"]:not([data-seo])'
      )
      .forEach((el) => el.remove());

    const created = [];

    created.push(addMeta("robots", robots));
    if (description) {
      created.push(addMeta("description", description));
      created.push(addMeta("og:description", description, true));
      created.push(addMeta("twitter:description", description));
    }
    created.push(addMeta("og:title", title, true));
    created.push(addMeta("og:site_name", SITE_NAME, true));
    created.push(addMeta("og:type", ogType, true));
    created.push(addMeta("og:url", url, true));
    if (ogImage) {
      created.push(addMeta("og:image", ogImage, true));
      created.push(addMeta("twitter:image", ogImage));
    }
    created.push(addMeta("twitter:card", "summary_large_image"));
    created.push(addMeta("twitter:title", title));

    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = url;
    link.setAttribute("data-seo", "");
    document.head.appendChild(link);
    created.push(link);

    const blocks = jsonLd
      ? Array.isArray(jsonLd)
        ? jsonLd
        : [jsonLd]
      : [];
    for (const block of blocks) {
      if (!block) continue;
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(block);
      script.setAttribute("data-seo", "");
      document.head.appendChild(script);
      created.push(script);
    }

    return () => created.forEach((el) => el.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, robots, ogType, ogImage, jsonLd]);

  return null;
}

function addMeta(name, content, property = false) {
  const m = document.createElement("meta");
  if (property) m.setAttribute("property", name);
  else m.setAttribute("name", name);
  m.content = content;
  m.setAttribute("data-seo", "");
  document.head.appendChild(m);
  return m;
}