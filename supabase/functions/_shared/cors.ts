// Restrictive CORS helper for Supabase Edge Functions.
// Set ALLOWED_ORIGIN as a Function secret per environment, e.g.
//   supabase secrets set ALLOWED_ORIGIN=https://your-domain.com
// Never use "*" in production.

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:5173";

// Optional: regex pattern for deploy-preview URLs (Netlify, Vercel).
// Set as env var, e.g.: CORS_PREVIEW_PATTERN=^https:\/\/[a-z0-9-]+--myapp\.netlify\.app$
const previewPattern = Deno.env.get("CORS_PREVIEW_PATTERN");

const defaultMethods = "POST, GET, OPTIONS";

/**
 * Returns CORS headers only if the request's Origin matches the allowed origin
 * or the optional deploy-preview pattern.
 * Without a request, returns static headers (backward-compatible fallback).
 */
export function getCorsHeaders(
  methods?: string[],
  req?: Request,
): Record<string, string> {
  const allowMethods = methods
    ? [...new Set([...methods, "OPTIONS"])].join(", ")
    : defaultMethods;

  // If a request is provided, validate its Origin header.
  if (req) {
    const origin = req.headers.get("Origin");
    const isExactMatch = origin === allowedOrigin;
    const isPreviewMatch = previewPattern && origin
      ? new RegExp(previewPattern).test(origin)
      : false;

    if (!isExactMatch && !isPreviewMatch) {
      // Origin doesn't match — return only Vary header, no CORS access.
      return { Vary: "Origin" };
    }

    // Echo the matched origin (required for non-wildcard CORS)
    return {
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": allowMethods,
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": allowMethods,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Backwards-compatible static headers (fallback only - prefer request-aware
// headers via getCorsHeaders(methods, req) or withCors()).
export const corsHeaders = getCorsHeaders();

const CORS_HEADER_NAMES = [
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Headers",
  "Access-Control-Allow-Methods",
  "Access-Control-Max-Age",
];

/**
 * Replaces any CORS headers on a Response with request-aware ones.
 * Used by createHandler() so every response (success + error) reflects the
 * actual request Origin - including preview-deploy origins matched by
 * CORS_PREVIEW_PATTERN, which a static snapshot would miss.
 */
export function withCors(
  res: Response,
  req: Request,
  methods?: string[],
): Response {
  // Strip any stale static CORS headers first: if the Origin doesn't match,
  // getCorsHeaders returns only `Vary` and nothing may grant access.
  for (const name of CORS_HEADER_NAMES) res.headers.delete(name);
  for (const [name, value] of Object.entries(getCorsHeaders(methods, req))) {
    res.headers.set(name, value);
  }
  return res;
}

export function handlePreflight(
  req: Request,
  methods?: string[],
): Response | null {
  if (req.method === "OPTIONS") {
    const headers = getCorsHeaders(methods, req);
    // If origin didn't match, respond 403 instead of granting access.
    if (!headers["Access-Control-Allow-Origin"]) {
      return new Response("Forbidden", { status: 403, headers });
    }
    return new Response(null, { status: 204, headers });
  }
  return null;
}
