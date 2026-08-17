import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderWithProviders, screen, mockFetch } from "./helpers/test-utils";

import LatestEpisodes from "@/components/LatestEpisodes";

describe("LatestEpisodes — DISC-03 deep-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.success([]);
  });

  it("renders View All Episodes as a wouter Link to /videos", () => {
    renderWithProviders(<LatestEpisodes channelId="UCtest123" />);

    const button = screen.getByTestId("button-view-all-episodes");
    // asChild renders the button styles on the inner Link <a>. The test should
    // find the closest enclosing anchor with href="/videos".
    const anchor = button.closest("a") || button.querySelector("a");
    expect(anchor).not.toBeNull();
    // wouter renders with the Router's base prefix; suffix matters.
    expect(anchor!.getAttribute("href")).toMatch(/\/videos$/);
  });

  it("renders a secondary external YouTube channel link with safe rel", () => {
    renderWithProviders(<LatestEpisodes channelId="UCtest123" />);

    const link = screen.getByTestId("link-youtube-channel");
    expect(link.getAttribute("target")).toBe("_blank");
    const rel = link.getAttribute("rel") || "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
    expect(link.getAttribute("href")).toContain("youtube.com");
  });
});
