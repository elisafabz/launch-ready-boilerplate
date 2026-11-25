// Explicit localStorage key for the Supabase session. Pinned so E2E tests can
// inject a session without depending on supabase-js's internal key derivation
// (`sb-<host-prefix>-auth-token`), which may change between versions.
export const AUTH_STORAGE_KEY = "sb-app-auth-token";
