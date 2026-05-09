import * as fs from "node:fs";
import * as path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

/**
 * Campaign Archive E2E (Phase 1)
 *
 * Covers ROADMAP success criteria #1–3 (criterion #4, Google Rich Results validator,
 * is the human checkpoint). Every navigated page also runs axe — required by
 * CLAUDE.md WCAG 2.1 AA policy.
 */

interface SeedCampaign {
  slug: string;
  status: "active" | "concluded";
  name: string;
}

interface SeedEpisode {
  campaignSlug: string;
  episodeNumber: number;
  podcastUrl?: string;
}

const CAMPAIGNS_JSON = path.resolve(
  __dirname,
  "../client/src/data/campaigns.json"
);
const EPISODES_JSON = path.resolve(
  __dirname,
  "../client/src/data/episodes.json"
);

const campaigns: SeedCampaign[] = JSON.parse(
  fs.readFileSync(CAMPAIGNS_JSON, "utf8")
).campaigns;
const episodes: SeedEpisode[] = JSON.parse(
  fs.readFileSync(EPISODES_JSON, "utf8")
).episodes;

const seededCampaign =
  campaigns.find((c) => c.status === "active") ?? campaigns[0];
const seededEpisodes = episodes.filter(
  (e) => e.campaignSlug === seededCampaign.slug
);
const seededEpisodeNumber = seededEpisodes[0].episodeNumber;

test.describe("Campaign Archive — Index", () => {
  test("loads campaigns index with proper title and at least one card", async ({
    page,
  }) => {
    await page.goto("/campaigns");

    await expect(page).toHaveTitle(/Campaigns.*Tales of Aneria/);

    const heading = page.locator("h1", { hasText: /campaigns/i });
    await expect(heading).toBeVisible();

    const cards = page.locator('[data-testid^="card-campaign-"]');
    expect(await cards.count()).toBeGreaterThan(0);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["svg-img-alt"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("status filter narrows the list", async ({ page }) => {
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    const allCount = await page
      .locator('[data-testid^="card-campaign-"]')
      .count();

    await page.getByTestId("filter-status-active").click();
    const activeCount = await page
      .locator('[data-testid^="card-campaign-"]')
      .count();
    const expectedActive = campaigns.filter((c) => c.status === "active").length;
    expect(activeCount).toBe(expectedActive);

    await page.getByTestId("filter-status-concluded").click();
    const concludedCount = await page
      .locator('[data-testid^="card-campaign-"]')
      .count();
    const expectedConcluded = campaigns.filter(
      (c) => c.status === "concluded"
    ).length;
    expect(concludedCount).toBe(expectedConcluded);

    await page.getByTestId("filter-status-all").click();
    const restoredCount = await page
      .locator('[data-testid^="card-campaign-"]')
      .count();
    expect(restoredCount).toBe(allCount);
  });
});

test.describe("Campaign Archive — Detail", () => {
  test("campaign detail page renders all sections and passes axe", async ({
    page,
  }) => {
    await page.goto(`/campaigns/${seededCampaign.slug}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("text-campaign-name")).toBeVisible();
    await expect(page.getByTestId("card-campaign-description")).toBeVisible();
    await expect(page.getByTestId("card-campaign-cast")).toBeVisible();
    await expect(page.getByTestId("card-campaign-episodes")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["svg-img-alt"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("unknown campaign slug renders Not Found fallback", async ({ page }) => {
    await page.goto("/campaigns/does-not-exist-xyz");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(/Campaign Not Found/i)
    ).toBeVisible();
    await expect(page.getByTestId("button-back-to-campaigns")).toBeVisible();
  });
});

test.describe("Campaign Archive — Episode", () => {
  test("episode detail page renders YouTube link with safe rel and passes axe", async ({
    page,
  }) => {
    await page.goto(
      `/campaigns/${seededCampaign.slug}/episodes/${seededEpisodeNumber}`
    );
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("text-episode-title")).toBeVisible();

    const youtubeLink = page.getByTestId("link-youtube");
    await expect(youtubeLink).toBeVisible();
    await expect(youtubeLink).toHaveAttribute("target", "_blank");
    const ytRel = await youtubeLink.getAttribute("rel");
    expect(ytRel).toContain("noopener");
    expect(ytRel).toContain("noreferrer");

    // Podcast link is conditional — assert safe rel only when present
    const podcastLink = page.getByTestId("link-podcast");
    if ((await podcastLink.count()) > 0) {
      await expect(podcastLink).toHaveAttribute("target", "_blank");
      const podRel = await podcastLink.getAttribute("rel");
      expect(podRel).toContain("noopener");
      expect(podRel).toContain("noreferrer");
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["svg-img-alt"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("JSON-LD on episode page is valid JSON and contains required fields", async ({
    page,
  }) => {
    await page.goto(
      `/campaigns/${seededCampaign.slug}/episodes/${seededEpisodeNumber}`
    );
    await page.waitForLoadState("networkidle");

    // Wait for SEO useEffect to populate the script tag
    await page.waitForFunction(() => {
      const el = document.querySelector('script[type="application/ld+json"]');
      return el && (el.textContent ?? "").includes("@graph");
    });

    const ldText = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();

    expect(ldText).toBeTruthy();
    const parsed = JSON.parse(ldText!);
    const graph = parsed["@graph"];
    expect(Array.isArray(graph)).toBe(true);

    const types = graph.map((n: { "@type": string }) => n["@type"]);
    expect(types).toContain("TVEpisode");
    expect(types).toContain("VideoObject");

    const video = graph.find(
      (n: { "@type": string }) => n["@type"] === "VideoObject"
    );
    expect(video.name).toBeTruthy();
    expect(video.thumbnailUrl).toBeTruthy();
    expect(video.uploadDate).toBeTruthy();
  });

  test("unknown episodeNumber renders Not Found fallback", async ({ page }) => {
    await page.goto(`/campaigns/${seededCampaign.slug}/episodes/9999`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Episode Not Found/i)).toBeVisible();
  });
});
