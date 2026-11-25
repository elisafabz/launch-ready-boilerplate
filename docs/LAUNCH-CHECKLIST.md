# Launch Checklist

What the boilerplate already enforces, and what each project has to do before go-live.

Run before every production deploy:

```bash
npm run launch-check     # placeholders, assets, VITE_SITE_URL
npm run lint             # alt text, valid anchors, no console.log
npm run build            # sitemap/robots, no source maps, bundle budget
npm run test:e2e         # console errors, h1, dead links, mobile overflow, 404
```

| Tell | Enforced by | Per project |
|---|---|---|
| Live on a preview domain | `launch-check` fails on localhost / `*.netlify.app` / `*.vercel.app`; build emits `Disallow: /` robots.txt when `VITE_SITE_URL` is unset | Set `VITE_SITE_URL` in the host's env |
| Generic page titles | `launch-check` + e2e `has title`; per-route via `usePageMeta()` | Real title in `index.html` and every page |
| Missing meta descriptions | same | Specific, under 160 chars |
| Default favicon | `launch-check` detects the placeholder | Replace `favicon.svg`, `favicon.ico`, regenerate touch icon |
| No Open Graph image | `launch-check`; `og:image` is absolute via `%VITE_SITE_URL%` | Edit `scripts/og-template.html`, run `npm run og:generate` |
| Missing canonical URLs | static in `index.html`, per route via `usePageMeta()` | Nothing |
| Broken social previews | `launch-check` flags placeholder og/twitter tags | Fill og/twitter tags in `index.html` |
| No custom 404 | `src/pages/NotFound.tsx`, e2e `custom 404 page` | Adjust copy to brand voice |
| Generic loading states | `PageLoader` names what loads, skeleton layout | Use `<PageLoader label="..." />` in your own Suspense boundaries |
| Generic error messages | `ErrorBoundary` names cause and next step; global query error toast in `App.tsx` | Add a support contact to the copy |
| Broken H1 structure | e2e `exactly one h1` | Keep one `<h1>` per page |
| Missing alt text | ESLint `jsx-a11y/alt-text`, e2e `every image has alt` | Decorative images get `alt=""` |
| No sitemap.xml / robots.txt | generated at build from `src/routes.ts` | Add indexable routes to `PUBLIC_ROUTES` |
| Console errors | e2e `renders without console errors` | Nothing |
| Leftover console.log | ESLint `no-console` (warn/error allowed) | Nothing |
| Exposed source maps | `build.sourcemap: false` | Nothing |
| Massive JS bundles | `postbuild` gzip budget 200 kB per chunk, Vite warning at 400 kB raw | Lazy-load heavy routes |
| Broken mobile layouts | e2e `no horizontal overflow` on Pixel 5 and iPhone 12 projects | Tap targets 44 px and up (`min-h-11`) |
| Inconsistent UI spacing | Tailwind scale via design tokens in `index.css` | No arbitrary values like `p-[13px]` |
| Dead buttons and links | ESLint `jsx-a11y/anchor-is-valid`, e2e `no dead links` | No "Coming soon" buttons in production |
