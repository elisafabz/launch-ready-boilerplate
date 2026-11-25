// DB-backed rate limiter using atomic upsert.
// Requires the Postgres table + function from
// supabase/migrations/00000000000001_rate_limits.sql (single source of
// truth for the DDL - applied by `supabase db reset` / `supabase db push`).
//
// Usage in an Edge Function:
//   await enforceRateLimit(`hello:${user.id}`, { max: 10, windowSeconds: 60 });

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
import { jsonError } from "./errors.ts";

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.retryAfter = retryAfter;
  }
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function enforceRateLimit(
  key: string,
  opts: { max: number; windowSeconds: number },
): Promise<void> {
  const supabase = serviceClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: opts.max,
    p_window_seconds: opts.windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error.message);
    // FAIL CLOSED by default: if the rate limiter itself errors (missing
    // table/function, DB outage), we reject the request with 429 rather
    // than silently running without rate limits. Tradeoff: a broken
    // rate_limits setup takes the endpoint down instead of exposing it
    // unprotected - for a security primitive, downtime beats an open door.
    // Escape hatch for local dev / migration gaps (NOT for production):
    //   supabase secrets set RATE_LIMIT_FAIL_OPEN=true
    if (Deno.env.get("RATE_LIMIT_FAIL_OPEN") === "true") {
      console.warn(
        "⚠️ RATE_LIMIT_FAIL_OPEN=true: request allowed despite failed rate " +
        "limit check. Apply supabase/migrations/00000000000001_rate_limits.sql " +
        "and unset this env var."
      );
      return;
    }
    throw new RateLimitError(opts.windowSeconds);
  }

  if (data > opts.max) {
    throw new RateLimitError(opts.windowSeconds);
  }
}

export function rateLimitErrorResponse(err: unknown): Response | null {
  if (err instanceof RateLimitError) {
    const res = jsonError(429, "rate_limited", "Too many requests");
    res.headers.set("Retry-After", String(err.retryAfter));
    return res;
  }
  return null;
}
