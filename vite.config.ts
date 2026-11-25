import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { PUBLIC_ROUTES } from "./src/routes.ts";

// Default for dev/test so %VITE_SITE_URL% in index.html always resolves.
// Production builds must set a real URL (see .env.example); seoAssets()
// warns and emits a noindex robots.txt otherwise.
const siteUrl = (process.env.VITE_SITE_URL ??= "http://localhost:5173").replace(/\/$/, "");
const isPreview = siteUrl.startsWith("http://localhost") || /\.(netlify|vercel)\.app$/.test(new URL(siteUrl).hostname);

/** Emits robots.txt and sitemap.xml into the build from src/routes.ts. */
function seoAssets(): Plugin {
  return {
    name: "seo-assets",
    apply: "build",
    generateBundle() {
      if (isPreview) {
        this.warn(`VITE_SITE_URL is "${siteUrl}": emitting robots.txt with Disallow: / and no sitemap. Set the production domain before launch.`);
        this.emitFile({ type: "asset", fileName: "robots.txt", source: "User-agent: *\nDisallow: /\n" });
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const urls = PUBLIC_ROUTES.map((r) => `  <url><loc>${siteUrl}${r === "/" ? "/" : r}</loc><lastmod>${today}</lastmod></url>`).join("\n");
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoAssets()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // Never ship source maps to production. Enable locally if you need them.
    sourcemap: false,
    // Fail loudly before a chunk gets big enough to hurt mobile load times.
    chunkSizeWarningLimit: 400,
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.spec.{ts,tsx}"],
    setupFiles: [],
  },
});
