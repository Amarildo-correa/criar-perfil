import { test, expect } from "@playwright/test";

test("sanity check da configuração do Playwright", async ({ page }) => {
    await page.goto("https://playwright.dev");
    await expect(page).toHaveTitle(/Playwright/);
});
