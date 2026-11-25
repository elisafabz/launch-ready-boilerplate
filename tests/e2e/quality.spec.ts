import { test, expect, type Page } from "@playwright/test";
import { PUBLIC_ROUTES } from "../../src/routes";

// Launch-quality checks for every public route. These catch the usual
// "shipped but never finished" tells: console errors, broken headings,
// images without alt, dead links, horizontal overflow on mobile.

async function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

for (const route of PUBLIC_ROUTES) {
  test.describe(`route ${route}`, () => {
    test("renders without console errors", async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      expect(errors, errors.join("\n")).toEqual([]);
    });

    test("has title, description and canonical", async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/.+/);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description?.trim().length ?? 0).toBeGreaterThan(0);
      expect(description!.length).toBeLessThanOrEqual(160);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toMatch(/^https?:\/\//);
    });

    test("has exactly one h1", async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
    });

    test("every image has alt text", async ({ page }) => {
      await page.goto(route);
      const missing = await page.locator("img:not([alt])").count();
      expect(missing).toBe(0);
    });

    test("no dead links", async ({ page, request }) => {
      await page.goto(route);
      const hrefs = await page.locator("a[href]").evaluateAll((as) =>
        as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
      const dead = hrefs.filter((h) => h === "" || h === "#" || h.startsWith("javascript:"));
      expect(dead, `placeholder hrefs: ${dead.join(", ")}`).toEqual([]);

      const internal = [...new Set(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("//")))];
      for (const href of internal) {
        const res = await request.get(href);
        expect(res.ok(), `${href} -> ${res.status()}`).toBeTruthy();
        await page.goto(href);
        await expect(page.locator("h1"), `${href} rendered the 404 page`).not.toHaveText(/does not exist/);
      }
    });

    test("no horizontal overflow", async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test("custom 404 page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.locator("h1")).toHaveText(/does not exist/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Go to home page" })).toHaveAttribute("href", "/");
  await expect(page.locator("body")).not.toContainText(/Oops/i);
});
