// Public, indexable routes. Used by:
//   - vite.config.ts  -> sitemap.xml at build time
//   - tests/e2e       -> dead-link and per-page quality checks
// Add a route here when you add an indexable page. Keep auth-only pages out.
export const PUBLIC_ROUTES = ["/"] as const;
