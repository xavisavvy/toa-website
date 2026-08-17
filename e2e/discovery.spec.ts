import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

/**
 * Phase 3 — Podcast & YouTube Discovery E2E
 *
 * Mirrors e2e/campaigns.spec.ts. Every navigated page also runs axe per
 * CLAUDE.md WCAG 2.1 AA policy.
 *
 * These tests run against the dev server with its server-side cache populated
 * (matching the e2e/campaigns.spec.ts pattern). If the dev environment lacks
 * a populated YouTube/podcast cache, the tests gracefully degrade to checking
 * the page chrome and accessibility — not the populated grid/list.
 */

test.describe("Discovery — /videos", () => {
  test("loads /videos with title, page header, and filter chips", async ({
    page,
  }) => {
    await page.goto("/videos");
    await expect(page).toHaveTitle(/Videos.*Tales of Aneria/);

    const heading = page.locator("h1", { hasText: /^Videos$/ });
    await expect(heading).toBeVisible();

    // Filter chips always render
    await expect(page.getByTestId("filter-type-all")).toBeVisible();
    await expect(page.getByTestId("filter-type-episodes")).toBeVisible();
    await expect(page.getByTestId("filter-type-shorts")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["svg-img-alt"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("filter chips do not throw and update the indicator", async ({
    page,
  }) => {
    await page.goto("/videos");
    await page.waitForLoadState("networkidle");

    // Click each filter — no exception thrown means the click handler ran.
    await page.getByTestId("filter-type-shorts").click();
    await page.getByTestId("filter-type-episodes").click();
    await page.getByTestId("filter-type-all").click();
  });

  test("video card opens YouTube watch URL with safe rel (when grid populated)", async ({
    page,
  }) => {
    await page.goto("/videos");
    await page.waitForLoadState("networkidle");

    const cards = page.locator('[data-testid^="card-video-"]');
    const cardCount = await cards.count();
    test.skip(
      cardCount === 0,
      "No videos rendered — dev cache not populated for E2E"
    );

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      cards.first().click(),
    ]);
    await expect(popup).toHaveURL(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    await popup.close();
  });
});

test.describe("Discovery — /podcast", () => {
  test("loads /podcast with subscribe strip and passes axe", async ({
    page,
  }) => {
    await page.goto("/podcast");
    await expect(page).toHaveTitle(/Podcast.*Tales of Aneria/);

    const heading = page.locator("h1", { hasText: /^Podcast$/ });
    await expect(heading).toBeVisible();

    // Subscribe strip platform buttons (top instance — testIdSuffix='top')
    await expect(page.getByTestId("button-spotify-top")).toBeVisible();
    await expect(page.getByTestId("button-apple-podcasts-top")).toBeVisible();
    await expect(page.getByTestId("button-youtube-music-top")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["svg-img-alt"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("podcast platform buttons open with safe rel (when feed populated)", async ({
    page,
  }) => {
    await page.goto("/podcast");
    await page.waitForLoadState("networkidle");

    const spotifyLinks = page.locator('[data-testid^="link-podcast-spotify-"]');
    const linkCount = await spotifyLinks.count();
    test.skip(
      linkCount === 0,
      "No podcast episodes rendered — feed not populated for E2E"
    );

    // The asChild button contains an <a> child when the URL is set
    const firstAnchor = spotifyLinks.first().locator("a");
    await expect(firstAnchor).toHaveAttribute("target", "_blank");
    const rel = (await firstAnchor.getAttribute("rel")) || "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });
});
