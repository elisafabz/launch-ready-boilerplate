// createHandler() - wraps Edge Function boilerplate into a single function.
//
// For edge cases where createHandler doesn't fit (streaming, WebSockets),
// use the individual helpers directly:
//   import { handlePreflight } from "./cors.ts";
//   import { requireUser } from "./auth.ts";
//   import { enforceRateLimit } from "./rate-limit.ts";
//   import { parseBody, z } from "./validate.ts";
//   import { jsonOk, jsonError } from "./errors.ts";

import { handlePreflight, withCors } from "./cors.ts";
import {
  requireUser,
  requireRole,
  authErrorResponse,
  type AuthedUser,
} from "./auth.ts";
import { enforceRateLimit, rateLimitErrorResponse } from "./rate-limit.ts";
import { validationErrorResponse } from "./validate.ts";
import { jsonError } from "./errors.ts";
import { getClientIp } from "./client-ip.ts";

type HandlerOptions = {
  /** Skip authentication. Default: false (requires auth). */
  public?: boolean;
  /**
   * Require an app_metadata role claim (e.g. "admin"). Implies auth:
   * requests without a valid JWT get 401, authenticated users without
   * the matching role get 403. Set roles server-side only via the
   * Admin API / service_role - never from the client.
   */
  role?: string;
  /** Allowed HTTP methods. Default: ["POST"]. */
  methods?: string[];
  /** Rate limiting config. Omit to disable. */
  rateLimit?: {
    max: number;
    windowSeconds: number;
    /** Override the auto-generated key prefix. Default: function name from URL path. */
    keyPrefix?: string;
  };
};

/**
 * Returns a request handler function. Call with Deno.serve():
 *
 *   Deno.serve(createHandler(async (req, user) => {
 *     const body = await parseBody(req, MySchema);
 *     return jsonOk({ message: "ok" });
 *   }));
 *
 * Validation is NOT automatic - call parseBody() inside your handler.
 * The catch block handles thrown ValidationError automatically.
 *
 * Admin-only endpoints: pass { role: "admin" } - createHandler then
 * enforces auth (401) and the app_metadata role claim (403).
 */
export function createHandler(
  fn: (req: Request, user: AuthedUser | null) => Promise<Response>,
  options?: HandlerOptions,
): (req: Request) => Promise<Response> {
  const methods = options?.methods ?? ["POST"];
  // A role requirement implies authentication, even if public is set.
  const isPublic = (options?.public ?? false) && !options?.role;

  return async (req: Request): Promise<Response> => {
    // 1. CORS preflight
    const preflight = handlePreflight(req, methods);
    if (preflight) return preflight;

    // 2. Method check
    if (!methods.includes(req.method)) {
      return withCors(
        jsonError(405, "method_not_allowed", `Use ${methods.join(", ")}`),
        req,
        methods,
      );
    }

    try {
      // 3. Auth (skip if public)
      let user: AuthedUser | null = null;
      if (!isPublic) {
        user = await requireUser(req);
      }

      // 3b. Role check (403 if the app_metadata role doesn't match)
      if (options?.role) {
        requireRole(user!, options.role);
      }

      // 4. Rate limiting (if configured)
      if (options?.rateLimit) {
        const prefix =
          options.rateLimit.keyPrefix ?? getFunctionName(req.url);
        const key = user
          ? `${prefix}:${user.id}`
          : `${prefix}:${getClientIp(req.headers)}`;
        await enforceRateLimit(key, {
          max: options.rateLimit.max,
          windowSeconds: options.rateLimit.windowSeconds,
        });
      }

      // 5. Run handler (re-apply request-aware CORS headers so preview
      // origins matched by CORS_PREVIEW_PATTERN work on real responses too)
      return withCors(await fn(req, user), req, methods);
    } catch (err) {
      const res =
        authErrorResponse(err) ??
        rateLimitErrorResponse(err) ??
        validationErrorResponse(err);
      if (res) return withCors(res, req, methods);
      // Unexpected error: log server-side (never returned to the client).
      console.error(`[${getFunctionName(req.url)}] unhandled error:`, err);
      return withCors(
        jsonError(500, "internal_error", "Unexpected server error"),
        req,
        methods,
      );
    }
  };
}

/** Extract function name from Supabase Edge Function URL path. */
function getFunctionName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    // Supabase URL: /functions/v1/<function-name>
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "unknown";
  } catch {
    return "unknown";
  }
}
