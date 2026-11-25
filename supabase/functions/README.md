# Edge Functions

API layer for this project. All business logic belongs here, not in the frontend.
The frontend calls Edge Functions via `supabase.functions.invoke(...)`.

## Pattern

Every new function follows this pattern (see `example-hello/index.ts`):

1. **Preflight** - `handlePreflight(req)` for OPTIONS requests
2. **Auth** - `requireUser(req)` throws 401 if the JWT is missing or invalid
3. **Rate Limit** - `enforceRateLimit(key, opts)` protects against abuse
4. **Validate** - `parseBody(req, ZodSchema)` validates input with Zod
5. **Business Logic** - the actual work
6. **Response** - `jsonOk(data)` or `jsonError(status, code, msg)`
7. **Error Handling** - try/catch with the `*ErrorResponse` helpers

## Creating a new function

```bash
cp -r supabase/functions/example-hello supabase/functions/my-function
# Then adjust index.ts: BodySchema and business logic
supabase functions deploy my-function
```

## Helper overview (`_shared/`)

| File | Purpose |
|---|---|
| `cors.ts` | CORS headers + preflight handler. Restrictive via `ALLOWED_ORIGIN` env |
| `auth.ts` | `requireUser(req)` validates the JWT and returns the user (incl. `app_metadata` role). `requireRole(user, role)` throws 403 |
| `validate.ts` | `parseBody(req, schema)` validates with Zod, throws 400 |
| `errors.ts` | Uniform `{ error: { code, message } }` format + `jsonOk` / `jsonError` |
| `rate-limit.ts` | DB-based rate limiter, requires the `rate_limits` table |

## Required environment secrets

Set once per project:

```bash
supabase secrets set ALLOWED_ORIGIN=https://your-domain.example
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are
# provided automatically by Supabase
```

## Required DB table + function for rate limiting

Provided as a migration in `supabase/migrations/00000000000001_rate_limits.sql`
(applied automatically by `supabase db reset` or `supabase db push`).
RLS is enabled with no policies: only `service_role` (Edge Functions) can
read or write. If the table is missing, the rate limiter rejects requests
with 429 (fail-closed).

## Keep the Zod version in sync

Edge Functions import Zod via `https://esm.sh/zod@X.Y.Z` (in `_shared/validate.ts`),
the frontend via `package.json`. When updating Zod, change **both** places so
frontend and backend use identical validation.

## Rules

- **Never** access the DB directly from the frontend - always go through Edge Functions
- **Never** put the `SERVICE_ROLE_KEY` in the frontend
- **Always** validate input with Zod
- **Always** use auth + rate limiting on user-facing endpoints
