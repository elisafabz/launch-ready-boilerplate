# react-supabase-boilerplate

React 19 · Vite 8 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Edge Functions + DB)

## Setup

```bash
npm install
npx playwright install   # REQUIRED — npm install does not fetch browser binaries
```

Without the second command every E2E test fails with
`browserType.launch: Executable doesn't exist`. This bites every fresh clone.

```bash
npm run dev          # dev server
npm run lint         # must stay clean, CI enforces it
npm run test         # unit tests (vitest)
npm run test:e2e     # end-to-end tests (playwright)
npm run build        # production build
```

## Auth and E2E login

The boilerplate ships no login UI. Auth is added per project (for an admin area use the `admin-dashboard` skill). Tests do not need a login page:

- `supabase/seed.sql` seeds `test@example.com` / `TestPassword123!` (local only, production guard).
- `tests/e2e/helpers/auth.ts` fetches a session from local GoTrue and injects it before the app loads. `getTestUserToken()` gives a bearer token for direct Edge Function calls.
- `tests/e2e/fixtures.ts` exports `test` with an `authedPage` fixture. `tests/e2e/auth.spec.ts` shows both.

Needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.test` (values from `supabase status`). Without them the auth tests skip.

## Before launch

```bash
npm run launch-check   # placeholders, favicon/OG image, VITE_SITE_URL
```

See `docs/LAUNCH-CHECKLIST.md` for what is enforced automatically and what each project has to fill in.

## Notes

`src/shadcn-theme.css` is vendored from the `shadcn` npm package rather than imported
from it — see the header comment in that file for why, and what to re-check after
running `npx shadcn@latest add`.

---

## Template notes

This project is based on React + TypeScript + Vite.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
