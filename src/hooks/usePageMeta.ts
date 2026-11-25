import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type PageMeta = {
  /** Page title. The site name is appended automatically. */
  title: string;
  /** Specific description for this page, under 160 characters. */
  description?: string;
  /** Exclude from search engines (404, auth-only, thank-you pages). */
  noindex?: boolean;
};

const SITE_NAME = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content ?? "";
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

/**
 * Sets title, description, canonical URL, OG/Twitter title+description and
 * the robots directive for the current route. Updates the static tags from
 * index.html in place, so there is exactly one of each.
 *
 *   usePageMeta({ title: "Preise", description: "All plans at a glance." });
 */
export function usePageMeta({ title, description, noindex = false }: PageMeta) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = SITE_NAME && title !== SITE_NAME ? `${title} | ${SITE_NAME}` : title;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });

    if (description) {
      setMeta('meta[name="description"]', { name: "description", content: description });
      setMeta('meta[property="og:description"]', { property: "og:description", content: description });
      setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    }

    const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
    setMeta('link[rel="canonical"]', { rel: "canonical", href: url });
    setMeta('meta[property="og:url"]', { property: "og:url", content: url });

    if (noindex) {
      setMeta('meta[name="robots"]', { name: "robots", content: "noindex, nofollow" });
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove();
    }
  }, [title, description, noindex, pathname]);
}
