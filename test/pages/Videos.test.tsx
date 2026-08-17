import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  renderWithProviders,
  screen,
  mockFetch,
  TestFactory,
  waitFor,
} from "../helpers/test-utils";

import LatestEpisodes from "@/components/LatestEpisodes";
import Videos from "@/pages/Videos";

// Stub the env var the page reads so the useQuery is enabled in tests.
beforeEach(() => {
  vi.stubEnv("VITE_YOUTUBE_CHANNEL_ID", "UCtest123");
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const makeVideos = (n: number, overrides: Record<string, unknown> = {}) =>
  Array.from({ length: n }, (_, i) =>
    TestFactory.video({
      id: `vid-${i + 1}`,
      title: `Video ${i + 1}`,
      ...overrides,
    })
  );

describe("Videos page", () => {
  it("renders 12 video cards on page 1 when 25 videos returned", async () => {
    mockFetch.success(makeVideos(25));

    renderWithProviders(<Videos />);

    // Wait for first card to render
    await screen.findByTestId("card-video-vid-1");

    const cards = screen.getAllByTestId(/^card-video-/);
    expect(cards.length).toBe(12);

    // ceil(25/12) = 3
    expect(
      screen.getByTestId("pagination-page-indicator").textContent
    ).toMatch(/Page 1 of 3/);
  });

  it("clicking pagination-next advances to page 2", async () => {
    mockFetch.success(makeVideos(25));

    const { getByTestId } = renderWithProviders(<Videos />);

    await screen.findByTestId("card-video-vid-1");

    const next = getByTestId("pagination-next");
    next.click();

    // Now should show vid-13
    await screen.findByTestId("card-video-vid-13");
    expect(
      screen.getByTestId("pagination-page-indicator").textContent
    ).toMatch(/Page 2 of 3/);
  });

  it("disables pagination-next on the last page", async () => {
    mockFetch.success(makeVideos(13));

    const { getByTestId } = renderWithProviders(<Videos />);
    await screen.findByTestId("card-video-vid-1");

    // Advance to last page (Page 2)
    getByTestId("pagination-next").click();
    await screen.findByTestId("card-video-vid-13");

    const next = getByTestId("pagination-next");
    expect(next.getAttribute("aria-disabled")).toBe("true");
  });

  it("Shorts filter narrows to videos with durationSeconds <= 60", async () => {
    const mix = [
      TestFactory.video({ id: "ep-1", durationSeconds: 3600 }),
      TestFactory.video({ id: "sh-1", durationSeconds: 30 }),
      TestFactory.video({ id: "ep-2", durationSeconds: 1800 }),
      TestFactory.video({ id: "sh-2", durationSeconds: 45 }),
    ];
    mockFetch.success(mix);

    const { getByTestId } = renderWithProviders(<Videos />);
    await screen.findByTestId("card-video-ep-1");

    getByTestId("filter-type-shorts").click();

    // Only short cards should remain
    await waitFor(() => {
      expect(screen.queryByTestId("card-video-ep-1")).toBeNull();
    });
    expect(screen.queryByTestId("card-video-ep-2")).toBeNull();
    expect(screen.getByTestId("card-video-sh-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-video-sh-2")).toBeInTheDocument();

    // Page resets to 1
    expect(
      screen.getByTestId("pagination-page-indicator").textContent
    ).toMatch(/Page 1 of/);
  });

  it("Episodes filter excludes shorts", async () => {
    const mix = [
      TestFactory.video({ id: "ep-1", durationSeconds: 3600 }),
      TestFactory.video({ id: "sh-1", durationSeconds: 30 }),
      TestFactory.video({ id: "ep-2", durationSeconds: 1800 }),
    ];
    mockFetch.success(mix);

    const { getByTestId } = renderWithProviders(<Videos />);
    await screen.findByTestId("card-video-ep-1");

    getByTestId("filter-type-episodes").click();

    await waitFor(() => {
      expect(screen.queryByTestId("card-video-sh-1")).toBeNull();
    });
    expect(screen.getByTestId("card-video-ep-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-video-ep-2")).toBeInTheDocument();
  });

  it("renders Shorts badge only on short cards", async () => {
    const mix = [
      TestFactory.video({ id: "ep-1", durationSeconds: 3600 }),
      TestFactory.video({ id: "sh-1", durationSeconds: 30 }),
    ];
    mockFetch.success(mix);

    renderWithProviders(<Videos />);
    await screen.findByTestId("card-video-ep-1");

    expect(screen.queryByTestId("badge-shorts-ep-1")).toBeNull();
    expect(screen.getByTestId("badge-shorts-sh-1")).toBeInTheDocument();
  });

  it("clicking a card opens YouTube watch URL with safe rel", async () => {
    mockFetch.success([
      TestFactory.video({ id: "abc12345678", durationSeconds: 1800 }),
    ]);

    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null as unknown as Window);

    const { getByTestId } = renderWithProviders(<Videos />);
    const card = await screen.findByTestId("card-video-abc12345678");
    card.click();

    expect(openSpy).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=abc12345678",
      "_blank",
      "noopener,noreferrer"
    );

    // Defensive: also confirm the test grabbed the right testid pagination
    expect(getByTestId("pagination-page-indicator")).toBeInTheDocument();

    openSpy.mockRestore();
  });

  it("renders error state with YouTube channel button when fetch fails", async () => {
    mockFetch.error(500, "down");

    renderWithProviders(<Videos />);

    const errorCard = await screen.findByTestId("card-error-state");
    expect(errorCard).toBeInTheDocument();
    expect(
      screen.getByTestId("button-error-youtube-channel")
    ).toBeInTheDocument();
  });

  it("renders empty state when API returns empty array", async () => {
    mockFetch.success([]);

    renderWithProviders(<Videos />);

    const empty = await screen.findByTestId("text-empty-state");
    expect(empty).toBeInTheDocument();
  });

  // R1 regression: distinct query key from LatestEpisodes
  it("uses a distinct cache key from LatestEpisodes (R1 regression)", async () => {
    // First mount LatestEpisodes which fetches /api/youtube/channel/:id?maxResults=50
    // and caches under ['/api/youtube/channel', channelId].
    mockFetch.success([
      TestFactory.video({ id: "le-1", title: "LE Single Item" }),
    ]);

    const { unmount, queryClient } = renderWithProviders(
      <LatestEpisodes channelId="UCtest123" />
    );
    await screen.findByText("LE Single Item");
    unmount();

    // Now mount Videos with a different fetch payload of 20 items. Videos uses
    // the distinct key ['/api/youtube/channel/full', channelId], so it must
    // perform its own fetch and render against the new payload, not the cached
    // 1-item LatestEpisodes slot.
    mockFetch.success(makeVideos(20));

    renderWithProviders(<Videos />, { queryClient });

    await screen.findByTestId("card-video-vid-1");
    const cards = screen.getAllByTestId(/^card-video-/);
    // 12 cards (page 1 of 20)
    expect(cards.length).toBe(12);
    expect(
      screen.getByTestId("pagination-page-indicator").textContent
    ).toMatch(/Page 1 of 2/);
  });
});
