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
  { name: "skills", path: "/skills" },
  { name: "journey", path: "/journey" },
  // Turnstile widget renders a non-deterministic iframe — mask it so Argos
  // doesn't flag false diffs on every run.
  { name: "contact", path: "/contact", mask: [".cf-turnstile-box"] }
];

for (const { name, path, mask } of pages) {
  test(`Run Argos on ${name} (${baseUrl}${path})`, async ({ page }) => {
    await page.goto(`${baseUrl}${path}`);
    await argosScreenshot(
      page,
      name,
      mask ? { mask: mask.map((selector) => page.locator(selector)) } : undefined
    );
  });
}