import { test as base, type Page } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

type Fixtures = { authedPage: Page };

/**
 * `authedPage`: a page that is already logged in as the seeded test user.
 *
 *   import { test, expect } from "./fixtures";
 *   test("dashboard", async ({ authedPage }) => { await authedPage.goto("/app"); ... });
 */
export const test = base.extend<Fixtures>({
  authedPage: async ({ page }, provide) => {
    await loginAsTestUser(page);
    await provide(page);
  },
});

export { expect } from "@playwright/test";
