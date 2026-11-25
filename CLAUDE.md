# Claude Code — Boilerplate Project Context

## Stack

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Edge Functions + DB)

## Commands

```bash
npm run dev          # Local dev server (Vite)
npm run build        # Production build (tsc + vite build)
npm run lint         # ESLint
npm run preview      # Preview the build locally
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Project Structure

```
src/
├── pages/              # Route pages (Index, NotFound, etc.)
├── components/
│   ├── ui/             # shadcn/ui components
│   └── ErrorBoundary.tsx
├── hooks/              # Custom React hooks
├── integrations/supabase/  # Supabase client + types
├── main.tsx            # Entry point
├── App.tsx             # Router + providers
└── index.css           # Design system (CSS variables)

supabase/
├── functions/
│   ├── _shared/        # Shared Edge Function helpers
│   │   ├── handler.ts  # createHandler() — auth + CORS + rate limit + validation
│   │   ├── auth.ts     # JWT-based user authentication
│   │   ├── cors.ts     # CORS with origin validation
│   │   ├── rate-limit.ts # DB-backed rate limiting
│   │   ├── validate.ts # Zod-based input validation
│   │   └── errors.ts   # Uniform error response format
│   └── example-hello/  # Example Edge Function (copy as a template)
├── migrations/         # DB schema (rate_limits table + check_rate_limit function)
├── seed.sql            # Test users (local only, runs AFTER migrations)
└── config.toml         # Supabase configuration
```

## Dependency Rules

- Import Radix primitives ONLY from the `radix-ui` umbrella (`import { Dialog as DialogPrimitive } from "radix-ui"`), NEVER as `@radix-ui/react-*` subpaths or as your own dependency. Two copies of e.g. `react-dismissable-layer` cause nested dialogs to close incorrectly. ESLint blocks subpath imports.
- No `legacy-peer-deps`. If `npm install` fails with ERESOLVE, resolve the conflict (pin a version or swap the package) instead of setting the flag. CI checks `npm ls --depth=0`.
- `tests/unit/ui-modules.spec.ts` loads every `ui/*.tsx`; new UI components are covered automatically.
- **Before using `ui/calendar.tsx`:** the component still depends on `react-day-picker@8` (hence `date-fns@^3`). Upgrade before the first date picker: `npm i react-day-picker@latest date-fns@latest`, then `npx shadcn@latest add calendar --overwrite`. While you are at it, regenerate the whole `ui/` folder against the current shadcn release so you don't end up with a mix of old and new generations.

## Edge Function Pattern

Always create new Edge Functions with `createHandler()`:

```typescript
import { createHandler } from "../_shared/handler.ts";
import { parseBody, z } from "../_shared/validate.ts";
import { jsonOk } from "../_shared/errors.ts";

const BodySchema = z.object({ name: z.string().min(1) });

Deno.serve(
  createHandler(
    async (req, user) => {
      const body = await parseBody(req, BodySchema);
      return jsonOk({ message: `Hello ${body.name}` });
    },
    { rateLimit: { max: 10, windowSeconds: 60 } },
  ),
);
```

Options: `public: true` (skip auth), `role: "admin"` (enforces the app_metadata role, 401/403), `methods: ["GET", "POST"]`, `rateLimit: { max, windowSeconds }`.

## GTM + Tracking Rules

The boilerplate ships WITHOUT tracking code. If you add tracking, follow these rules:

- The GTM ID MUST come from an env var (`%VITE_GTM_ID%` in index.html), NEVER hardcoded
- Reason: E2E tests run with `--mode test` and must not emit analytics events
- `.env.test` must NOT contain `VITE_GTM_ID` (so GTM does not load in test mode)
- Disable Supabase events and sessions in test mode via `import.meta.env.MODE === 'test'`
- Do not boot PostHog in test mode
- All tracking systems (Supabase, PostHog, GTM) must be silent in test mode

## Security Rules

- Business logic always goes through Edge Functions, never directly from the frontend to the DB
- `service_role` key ONLY in Edge Functions, NEVER in the frontend
- CORS: set `ALLOWED_ORIGIN` as a Supabase secret (never `*` in production)
- Rate limiting: the `rate_limits` table must exist in the DB (see `supabase/migrations/00000000000001_rate_limits.sql`)
- Environment variables: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` must be set

## Security Defaults

Framework rules for every project that forks this boilerplate:

- **Deny-by-default RLS:** enable RLS on every table, NEVER create `anon` policies. Tables without policies are reachable only via `service_role` (Edge Functions) - this is intended.
- **All client writes go through Edge Functions:** the frontend never writes to the DB directly; it always calls an Edge Function (with auth, validation, rate limit).
- **Admin endpoints MUST use the `role` option:** `createHandler(fn, { role: "admin" })`. Roles are set only server-side via the Admin API in `app_metadata`, never by the client.
- **Rate limiting is fail-closed:** if the `check_rate_limit` call fails, the request is rejected with 429 (opt-out only locally via `RATE_LIMIT_FAIL_OPEN=true`).
- **Error responses leak no details:** `jsonError()` logs `details` only server-side and never returns them to the client.
- **Deploy together (lesson learned from a real incident):** schema migrations, Edge Function deploys and frontend deploys MUST ship together. Never build a security fix without deploying it.

## Changelog

- Every project created from this boilerplate MUST have a `CHANGELOG.md` in the root
- The changelog documents **user-facing changes** - no purely technical fixes (CI, linting, refactoring) unless they affect the user experience
- Format: grouped by date, newest first, short descriptions in plain English
- Update the changelog for every feature, UI change or important bugfix
- Template:

```markdown
# Changelog

Overview of user-facing changes.

---

## YYYY-MM-DD

### Short title
- Description of the change from the user's perspective
```
