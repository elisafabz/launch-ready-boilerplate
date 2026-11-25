// Uniform error response format across all Edge Functions.
// Always shape: { error: { code, message } }
//
// Pass the incoming Request as the last argument so responses carry
// request-aware CORS headers (needed for CORS_PREVIEW_PATTERN origins).
// Inside createHandler() this is optional - the handler re-applies
// per-request CORS headers to every response anyway.

import { corsHeaders, getCorsHeaders } from "./cors.ts";

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  req?: Request,
): Response {
  // SECURITY: never serialize `details` into the response body - it may
  // contain internals (schemas, SQL errors, stack traces). Log it instead.
  // The param is kept for backward compatibility with existing callers.
  if (details !== undefined) {
    console.error(`[${code}]`, message, details);
  }
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: {
        ...(req ? getCorsHeaders(undefined, req) : corsHeaders),
        "Content-Type": "application/json",
      },
    },
  );
}

export function jsonOk<T>(body: T, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(req ? getCorsHeaders(undefined, req) : corsHeaders),
      "Content-Type": "application/json",
    },
  });
}
