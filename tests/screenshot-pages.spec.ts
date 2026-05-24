import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";

const pages = [
  { name: "homepage", path: "/" },
  { name: "projects", path: "/projects" },
];

for (const { name, path } of pages) {
  test(`Run Argos on ${name} (${path})`, async ({ page }) => {
    await page.goto(path);
    await argosScreenshot(page, name);
  });
}