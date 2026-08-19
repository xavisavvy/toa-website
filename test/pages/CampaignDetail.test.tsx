import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { createTestQueryClient } from "../helpers/test-utils";

import campaignsData from "@/data/campaigns.json";
import episodesData from "@/data/episodes.json";
import CampaignDetail from "@/pages/CampaignDetail";

function renderAt(path: string, ui: ReactElement) {
  const { hook } = memoryLocation({ path });
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Router hook={hook}>{ui}</Router>
    </QueryClientProvider>
  );
}

describe("CampaignDetail page", () => {
  const seeded = campaignsData.campaigns[0]; // active seeded campaign

  beforeEach(() => {
    document.title = "";
    // remove any leftover JSON-LD from prior tests so JSON.parse asserts are clean
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => s.remove());
    // Fail the live playlist fetch so tests exercise the static episodes.json
    // fallback deterministically, without hitting the network.
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false } as Response)
    );
  });

  it("renders campaign name, description, cast, and episode list for a known slug", () => {
    const { getByTestId, getAllByTestId } = renderAt(
      `/campaigns/${seeded.slug}`,
      <CampaignDetail />
    );

    expect(getByTestId("text-campaign-name").textContent).toBe(seeded.name);
    expect(getByTestId("card-campaign-description")).toBeTruthy();
    expect(getByTestId("card-campaign-cast")).toBeTruthy();
    expect(getByTestId("card-campaign-episodes")).toBeTruthy();

    const seededEpisodes = episodesData.episodes.filter(
      (e) => e.campaignSlug === seeded.slug
    );
    const links = getAllByTestId(/^link-episode-/);
    expect(links.length).toBe(seededEpisodes.length);
  });

  it("orders episodes ascending by episodeNumber", () => {
    const { getAllByTestId } = renderAt(
      `/campaigns/${seeded.slug}`,
      <CampaignDetail />
    );

    const links = getAllByTestId(/^link-episode-/);
    const numbers = links.map((el) =>
      Number(el.getAttribute("data-testid")!.replace("link-episode-", ""))
    );
    const sorted = [...numbers].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });

  it("resolves cast ids from cast.json into rendered cast rows", () => {
    const { getByTestId } = renderAt(
      `/campaigns/${seeded.slug}`,
      <CampaignDetail />
    );

    for (const id of seeded.cast) {
      expect(getByTestId(`cast-row-${id}`)).toBeTruthy();
    }
  });

  it("emits @graph JSON-LD containing TVSeries and BreadcrumbList", () => {
    renderAt(`/campaigns/${seeded.slug}`, <CampaignDetail />);

    const ldScript = document.querySelector('script[type="application/ld+json"]');
    expect(ldScript).toBeTruthy();
    const parsed = JSON.parse(ldScript!.textContent ?? "{}");
    expect(parsed["@graph"]).toBeDefined();
    const types = (parsed["@graph"] as Array<{ "@type": string }>).map(
      (n) => n["@type"]
    );
    expect(types).toContain("TVSeries");
    expect(types).toContain("BreadcrumbList");
  });

  it("renders Not Found fallback for an unknown slug", () => {
    const { getByText, queryByTestId } = renderAt(
      "/campaigns/does-not-exist-xyz",
      <CampaignDetail />
    );

    expect(getByText(/Campaign Not Found/i)).toBeTruthy();
    expect(queryByTestId("text-campaign-name")).toBeNull();
    expect(queryByTestId("button-back-to-campaigns")).toBeTruthy();
  });
});
