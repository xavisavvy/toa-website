import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderWithProviders, screen, mockFetch } from "./helpers/test-utils";

import PodcastSection from "@/components/PodcastSection";

describe("PodcastSection — DISC-03 deep-link + subscribe strip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.success([]);
  });

  it("renders Browse all episodes as a wouter Link to /podcast", () => {
    renderWithProviders(
      <PodcastSection
        feedUrl="https://example.com/rss"
        spotifyUrl="https://open.spotify.com/show/test"
        applePodcastsUrl="https://podcasts.apple.com/test"
        youtubeMusicUrl="https://music.youtube.com/test"
      />
    );

    const button = screen.getByTestId("button-browse-all-podcast");
    const anchor = button.closest("a") || button.querySelector("a");
    expect(anchor).not.toBeNull();
    // wouter renders the Link with the Router's base prefix; the suffix is
    // what matters for the deep-link behavior.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by not.toBeNull() above
    expect(anchor!.getAttribute("href")).toMatch(/\/podcast$/);
  });

  it("mounts PodcastSubscribeStrip when an episode is loaded", async () => {
    mockFetch.success([
      {
        id: "ep-1",
        title: "Featured",
        description: "Test",
        pubDate: "2024-01-01T00:00:00Z",
        duration: "10:00",
      },
    ]);

    renderWithProviders(
      <PodcastSection
        feedUrl="https://example.com/rss"
        spotifyUrl="https://open.spotify.com/show/test"
        applePodcastsUrl="https://podcasts.apple.com/test"
        youtubeMusicUrl="https://music.youtube.com/test"
      />
    );

    // The subscribe strip in the featured-episode block uses the default
    // (empty) testIdSuffix, so its Spotify button is `button-spotify`.
    expect(await screen.findByTestId("button-spotify")).toBeInTheDocument();
  });
});
