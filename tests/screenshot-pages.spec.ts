import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";

const baseUrl = "http://localhost:3000";

const pages = [
  { name: "homepage", path: "/" },
  { name: "projects", path: "/projects" },
];

for (const { name, path } of pages) {
  test(`Run Argos on ${name} (${baseUrl}${path})`, async ({ page }) => {
    await page.goto(`${baseUrl}${path}`);
    await argosScreenshot(page, name);
  });
}