import { type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { AUTH_STORAGE_KEY } from "../../../src/integrations/supabase/auth-storage-key";

/**
 * Programmatic login for E2E tests. No login page required.
 *
 * 1. Asks local GoTrue for a session (email + password grant) for the user
 *    seeded by supabase/seed.sql.
 * 2. Injects that session into localStorage under the key the app's Supabase
 *    client reads, before any app code runs (page.addInitScript).
 *
 * Works regardless of the project's auth UI (password, magic link, OAuth):
 * email+password is a GoTrue capability, not a UI feature. Projects that
 * disable the email provider should switch this to
 * auth.admin.generateLink() with the service_role key.
 *
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY in .env.test
 * (CI writes them from `supabase status`). Use hasSupabaseEnv() to skip
 * auth tests when they are absent.
 */

export const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
};

type Session = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: { id: string; email?: string };
};

function readEnvTest(): Record<string, string> {
  if (!existsSync(".env.test")) return {};
  return Object.fromEntries(
    readFileSync(".env.test", "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const [k, ...v] = l.split("=");
        return [k.trim(), v.join("=").trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

const env = { ...readEnvTest(), ...process.env };
export const SUPABASE_URL = (env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Fresh session from GoTrue. Fails with a clear message if the seed is missing. */
export async function getTestUserSession(): Promise<Session> {
  if (!hasSupabaseEnv()) {
    throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing in .env.test. Run `supabase start` and copy the values from `supabase status`.");
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(TEST_USER),
  });
  if (res.status === 400) {
    throw new Error(`Seeded test user ${TEST_USER.email} missing or password changed. Run: supabase db reset`);
  }
  if (!res.ok) {
    throw new Error(`GoTrue ${res.status} at ${SUPABASE_URL}: ${await res.text()}`);
  }
  const session = (await res.json()) as Session;
  session.expires_at ??= Math.floor(Date.now() / 1000) + session.expires_in;
  return session;
}

/** Bearer token for direct Edge Function calls from tests. */
export async function getTestUserToken(): Promise<string> {
  return (await getTestUserSession()).access_token;
}

/**
 * Log the page in as the seeded test user. Call before the first page.goto().
 * Note: the init script runs on every navigation, so a UI logout followed by
 * a navigation logs back in. Use one page per test.
 */
export async function loginAsTestUser(page: Page): Promise<Session> {
  const session = await getTestUserSession();
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [AUTH_STORAGE_KEY, JSON.stringify(session)] as const,
  );
  return session;
}
