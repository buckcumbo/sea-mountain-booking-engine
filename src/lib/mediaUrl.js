// Fast, sized variants of Wix-hosted images (media.base44.com uploads)
// WITHOUT the blur-up machinery — for heroes and cards where we want the real
// photo quickly with a simple fade-in. Uses `fit` (proportional downscale,
// never a crop, never a warp) and WebP re-encoding. Non-Wix URLs pass through
// untouched.
const WIX_HOSTS = ["media.base44.com", "static.wixstatic.com"];

export function sizedImageUrl(src, width = 1920, quality = 80) {
  try {
    const url = new URL(src);
    if (!WIX_HOSTS.includes(url.hostname)) return src;
    const v1 = url.pathname.indexOf("/v1/");
    const basePath = v1 === -1 ? url.pathname : url.pathname.slice(0, v1);
    const filename = basePath.split("/").pop();
    if (!filename || /\.svg$/i.test(filename) || /\.gif$/i.test(filename)) return src;
    const out = filename.replace(/\.[a-z0-9]+$/i, "") + ".webp";
    return `${url.origin}${basePath}/v1/fit/w_${width},h_${width},q_${quality},enc_webp,quality_auto/${out}`;
  } catch {
    return src;
  }
}