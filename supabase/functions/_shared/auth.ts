// Auth helper: extracts and verifies the Supabase user from the request JWT.
// Use this at the top of every Edge Function that requires authentication.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
import { jsonError } from "./errors.ts";

export type AuthedUser = {
  id: string;
  email: string | null;
  /** Role claim from app_metadata (set server-side only, never by the user). */
  role: string | null;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing bearer token");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    throw new AuthError("Server misconfigured: missing Supabase env", 500);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AuthError("Invalid or expired token");
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    // app_metadata can only be written via service_role / Admin API,
    // never by the user themselves - safe to use for authorization.
    role: (data.user.app_metadata?.role as string | undefined) ?? null,
  };
}

/**
 * Throws a 403 AuthError if the user's app_metadata role doesn't match.
 * Use for admin-only endpoints:
 *
 *   requireRole(user, "admin");
 */
export function requireRole(user: AuthedUser, role: string): void {
  if (user.role !== role) {
    throw new AuthError("Insufficient permissions", 403);
  }
}

export function authErrorResponse(err: unknown): Response | null {
  if (err instanceof AuthError) {
    const code = err.status === 403 ? "forbidden" : "unauthorized";
    return jsonError(err.status, code, err.message);
  }
  return null;
}
