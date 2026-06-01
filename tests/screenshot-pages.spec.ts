import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";

// 測試 CI
const baseUrl = "http://localhost:3000";

const pages = [
  { name: "homepage", path: "/" },
  { name: "about", path: "/about" },
  { name: "projects", path: "/projects" },
  { name: "project-detail", path: "/projects/01-field" },
  { name: "blog", path: "/blog" },
  { name: "blog-detail", path: "/blog/2026-04-12-on-grids-that-fail-gracefully" },
  { name: "skills", path: "/skills" }
];

for (const { name, path } of pages) {
  test(`Run Argos on ${name} (${baseUrl}${path})`, async ({ page }) => {
    await page.goto(`${baseUrl}${path}`);
    await argosScreenshot(page, name);
  });
}