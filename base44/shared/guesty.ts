// Shared Guesty configuration for backend functions.
// Imported by guestyAuth / guestyFetch via relative path.
export function getGuestyConfig() {
  const apiKey = Deno.env.get("GUESTY_API_KEY");
  const apiSecret = Deno.env.get("GUESTY_API_SECRET");
  const baseUrl = "https://api.guesty.com/api/v2";
  return {
    baseUrl,
    configured: Boolean(apiKey && apiSecret),
    apiKey,
    apiSecret,
  };
}