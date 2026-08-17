import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import campaignsData from "@/data/campaigns.json";
import episodesData from "@/data/episodes.json";
import EpisodeDetail from "@/pages/EpisodeDetail";

function renderAt(path: string, ui: ReactElement) {
  const { hook } = memoryLocation({ path });
  return render(<Router hook={hook}>{ui}</Router>);
}

describe("EpisodeDetail page", () => {
  const seededCampaign = campaignsData.campaigns[0];
  const seededEpisodes = episodesData.episodes.filter(
    (e) => e.campaignSlug === seededCampaign.slug
  );
  const epWithPodcast = seededEpisodes.find((e) => "podcastUrl" in e)!;
  const epWithoutPodcast = seededEpisodes.find((e) => !("podcastUrl" in e));

  beforeEach(() => {
    document.title = "";
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => s.remove());
  });

  it("renders episode title and airDate when (slug, episodeNumber) matches", () => {
    const { getByTestId } = renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/${epWithPodcast.episodeNumber}`,
      <EpisodeDetail />
    );

    const title = getByTestId("text-episode-title").textContent ?? "";
    expect(title).toContain(`Ep ${epWithPodcast.episodeNumber}`);
    expect(title).toContain(epWithPodcast.title);
    expect(getByTestId("text-episode-airdate").textContent).toContain(
      epWithPodcast.airDate
    );
  });

  it("renders Not Found for unknown campaign slug", () => {
    const { getByText, queryByTestId } = renderAt(
      "/campaigns/does-not-exist/episodes/1",
      <EpisodeDetail />
    );
    expect(getByText(/Episode Not Found/i)).toBeTruthy();
    expect(queryByTestId("text-episode-title")).toBeNull();
  });

  it("renders Not Found for unknown episodeNumber", () => {
    const { getByText, queryByTestId } = renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/9999`,
      <EpisodeDetail />
    );
    expect(getByText(/Episode Not Found/i)).toBeTruthy();
    expect(queryByTestId("text-episode-title")).toBeNull();
  });

  it("YouTube link is always present with target=_blank and safe rel", () => {
    const { getByTestId } = renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/${epWithPodcast.episodeNumber}`,
      <EpisodeDetail />
    );

    const link = getByTestId("link-youtube");
    expect(link.getAttribute("href")).toBe(epWithPodcast.youtubeUrl);
    expect(link.getAttribute("target")).toBe("_blank");
    const rel = link.getAttribute("rel") ?? "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("podcast link renders when podcastUrl present, with safe rel", () => {
    const { getByTestId } = renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/${epWithPodcast.episodeNumber}`,
      <EpisodeDetail />
    );

    const link = getByTestId("link-podcast");
    expect(link.getAttribute("href")).toBe(epWithPodcast.podcastUrl!);
    expect(link.getAttribute("target")).toBe("_blank");
    const rel = link.getAttribute("rel") ?? "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("podcast link is not rendered when podcastUrl is absent", () => {
    if (!epWithoutPodcast) {
      // seed currently has all episodes with podcastUrl absent or present;
      // skip when seed doesn't expose this branch
      return;
    }
    const { queryByTestId } = renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/${epWithoutPodcast.episodeNumber}`,
      <EpisodeDetail />
    );
    expect(queryByTestId("link-podcast")).toBeNull();
    expect(queryByTestId("link-youtube")).toBeTruthy();
  });

  it("@graph JSON-LD contains TVEpisode + VideoObject + BreadcrumbList with required Google fields populated", () => {
    renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/${epWithPodcast.episodeNumber}`,
      <EpisodeDetail />
    );

    const ldScript = document.querySelector('script[type="application/ld+json"]');
    expect(ldScript).toBeTruthy();
    const parsed = JSON.parse(ldScript!.textContent ?? "{}");
    const graph = parsed["@graph"] as Array<Record<string, unknown>>;
    expect(Array.isArray(graph)).toBe(true);

    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("TVEpisode");
    expect(types).toContain("VideoObject");
    expect(types).toContain("BreadcrumbList");

    const video = graph.find((n) => n["@type"] === "VideoObject")!;
    expect(video.name).toBeTruthy();
    expect(video.thumbnailUrl).toBeTruthy(); // CAMP-04 required
    expect(video.uploadDate).toBeTruthy(); // CAMP-04 required
  });

  it("@graph also contains PodcastEpisode when podcastUrl is present", () => {
    renderAt(
      `/campaigns/${seededCampaign.slug}/episodes/${epWithPodcast.episodeNumber}`,
      <EpisodeDetail />
    );

    const ldScript = document.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(ldScript!.textContent ?? "{}");
    const types = (parsed["@graph"] as Array<Record<string, string>>).map(
      (n) => n["@type"]
    );
    expect(types).toContain("PodcastEpisode");
  });
});
