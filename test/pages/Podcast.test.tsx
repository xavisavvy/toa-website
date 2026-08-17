import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  renderWithProviders,
  screen,
  mockFetch,
  TestFactory,
} from "../helpers/test-utils";

import Podcast from "@/pages/Podcast";

beforeEach(() => {
  vi.stubEnv("VITE_PODCAST_FEED_URL", "https://example.com/feed.xml");
  vi.stubEnv("VITE_PODCAST_SPOTIFY_URL", "https://open.spotify.com/show/test");
  vi.stubEnv(
    "VITE_PODCAST_APPLE_URL",
    "https://podcasts.apple.com/podcast/test"
  );
  vi.stubEnv(
    "VITE_PODCAST_YOUTUBE_MUSIC_URL",
    "https://music.youtube.com/podcast/test"
  );
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Podcast page", () => {
  it("renders the top subscribe strip with all three platforms", async () => {
    mockFetch.success([]);

    renderWithProviders(<Podcast />);

    // PodcastSubscribeStrip with testIdSuffix="top" exposes:
    expect(
      await screen.findByTestId("button-spotify-top")
    ).toBeInTheDocument();
    expect(screen.getByTestId("button-apple-podcasts-top")).toBeInTheDocument();
    expect(
      screen.getByTestId("button-youtube-music-top")
    ).toBeInTheDocument();
  });

  it("renders all episodes from the feed in order", async () => {
    const eps = [
      TestFactory.episode({ id: "ep-1", title: "First Episode" }),
      TestFactory.episode({ id: "ep-2", title: "Second Episode" }),
      TestFactory.episode({ id: "ep-3", title: "Third Episode" }),
    ];
    mockFetch.success(eps);

    renderWithProviders(<Podcast />);

    await screen.findByTestId("text-podcast-title-ep-1");

    const titles = screen.getAllByTestId(/^text-podcast-title-/);
    expect(titles.map((t) => t.textContent)).toEqual([
      "First Episode",
      "Second Episode",
      "Third Episode",
    ]);
  });

  it("per-entry platform buttons have target=_blank and safe rel", async () => {
    mockFetch.success([
      TestFactory.episode({ id: "ep-1", title: "An Episode" }),
    ]);

    renderWithProviders(<Podcast />);

    const spotifyBtn = await screen.findByTestId("link-podcast-spotify-ep-1");
    // The button uses asChild → renders an <a> inside; assert on the anchor.
    const anchor = spotifyBtn.querySelector("a") || spotifyBtn;
    expect(anchor.getAttribute("target")).toBe("_blank");
    const rel = anchor.getAttribute("rel") || "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("renders error state when the feed fetch fails", async () => {
    mockFetch.error(500, "down");

    renderWithProviders(<Podcast />);

    expect(await screen.findByTestId("card-error-state")).toBeInTheDocument();
    expect(
      screen.getByTestId("button-error-podcast-platform")
    ).toBeInTheDocument();
  });

  it("renders empty state when feed returns no episodes", async () => {
    mockFetch.success([]);

    renderWithProviders(<Podcast />);

    expect(await screen.findByTestId("text-empty-state")).toBeInTheDocument();
  });

  it("renders description as plain text (no HTML injection)", async () => {
    const malicious = "Hello <script>alert(1)</script> world";
    mockFetch.success([
      TestFactory.episode({
        id: "ep-xss",
        title: "Test Episode",
        description: malicious,
      }),
    ]);

    renderWithProviders(<Podcast />);

    const desc = await screen.findByTestId("text-podcast-description-ep-xss");
    // React JSX escapes the angle brackets — the literal string appears as text
    expect(desc.textContent).toBe(malicious);
    // Defensive: confirm no <script> child was actually inserted
    expect(desc.querySelector("script")).toBeNull();
  });
});
