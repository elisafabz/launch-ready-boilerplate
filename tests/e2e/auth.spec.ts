import { test, expect } from "./fixtures";
import { getTestUserToken, hasSupabaseEnv, SUPABASE_URL, SUPABASE_ANON_KEY } from "./helpers/auth";
import { AUTH_STORAGE_KEY } from "../../src/integrations/supabase/auth-storage-key";

// Keeps the programmatic login helper honest. Skips when no local Supabase
// is configured (.env.test), runs in CI where the workflow boots one.
test.describe("programmatic login", () => {
  test.skip(!hasSupabaseEnv(), "no Supabase env in .env.test");

  test("authedPage carries a session the app's client can read", async ({ authedPage }) => {
    await authedPage.goto("/");
    const raw = await authedPage.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const session = JSON.parse(raw!);
    expect(session.access_token).toMatch(/^eyJ/);
    expect(session.user.email).toBe("test@example.com");
  });

  test("token authenticates against an Edge Function", async ({ request }) => {
    const token = await getTestUserToken();
    const url = `${SUPABASE_URL}/functions/v1/example-hello`;

    const ok = await request.post(url, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, Origin: "http://localhost:5173" },
      data: { name: "E2E" },
    });
    expect(ok.status(), await ok.text()).toBe(200);
    expect((await ok.json()).message).toMatch(/^Hello E2E, your user id is [0-9a-f-]{36}$/);

    const anon = await request.post(url, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY, Origin: "http://localhost:5173" },
      data: { name: "E2E" },
    });
    expect(anon.status()).toBe(401);
  });
});
