import {
  CampaignsFileSchema,
  EpisodesFileSchema,
} from "@shared/schema";
import { describe, it, expect } from "vitest";

import campaignsData from "@/data/campaigns.json";
import castData from "@/data/cast.json";
import episodesData from "@/data/episodes.json";

/**
 * Build-time integrity guard for client/src/data/campaigns.json + episodes.json.
 *
 * This test is the gate that stops malformed authored content from shipping to
 * production. Every author edit to either JSON file is sanity-checked here:
 *
 *   1. Schema shape (Zod) — required fields, kebab-case slug, ISO dates,
 *      YouTube URL host, etc.
 *   2. Referential integrity — every episode points to a real campaign,
 *      every campaign cast id resolves in cast.json.
 *   3. Episode-number uniqueness within a campaign.
 *
 * Any failure here blocks pre-commit / pre-push and CI.
 */
describe("campaigns / episodes static data", () => {
  it("campaigns.json matches CampaignsFileSchema", () => {
    expect(() => CampaignsFileSchema.parse(campaignsData)).not.toThrow();
  });

  it("episodes.json matches EpisodesFileSchema", () => {
    expect(() => EpisodesFileSchema.parse(episodesData)).not.toThrow();
  });

  it("contains at least one campaign", () => {
    expect(campaignsData.campaigns.length).toBeGreaterThan(0);
  });

  it("contains at least two episodes for the seeded active campaign", () => {
    const activeCampaign = campaignsData.campaigns.find(
      (c) => c.status === "active"
    );
    expect(activeCampaign).toBeDefined();
    const eps = episodesData.episodes.filter(
      (e) => e.campaignSlug === activeCampaign!.slug
    );
    expect(eps.length).toBeGreaterThanOrEqual(2);
  });

  it("every episode references an existing campaign slug", () => {
    const slugs = new Set(campaignsData.campaigns.map((c) => c.slug));
    for (const ep of episodesData.episodes) {
      expect(
        slugs.has(ep.campaignSlug),
        `episode ${ep.id} references unknown campaignSlug "${ep.campaignSlug}"`
      ).toBe(true);
    }
  });

  it("every campaign cast id resolves to a cast member", () => {
    const ids = new Set(castData.cast.map((c) => c.id));
    for (const c of campaignsData.campaigns) {
      for (const id of c.cast) {
        expect(
          ids.has(id),
          `campaign "${c.slug}" references unknown cast id "${id}"`
        ).toBe(true);
      }
    }
  });

  it("episode (campaignSlug, episodeNumber) tuples are unique", () => {
    const seen = new Set<string>();
    for (const ep of episodesData.episodes) {
      const key = `${ep.campaignSlug}#${ep.episodeNumber}`;
      expect(seen.has(key), `duplicate episode key ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("at least one episode has a podcastUrl (exercises EpisodeDetail conditional render)", () => {
    const withPodcast = episodesData.episodes.filter((e) => "podcastUrl" in e);
    expect(withPodcast.length).toBeGreaterThan(0);
  });
});
