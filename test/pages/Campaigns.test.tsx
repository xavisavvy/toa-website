import { describe, it, expect, beforeEach } from "vitest";

import { renderWithProviders, fireEvent } from "../helpers/test-utils";

import campaignsData from "@/data/campaigns.json";
import episodesData from "@/data/episodes.json";
import Campaigns from "@/pages/Campaigns";

describe("Campaigns index page", () => {
  beforeEach(() => {
    document.title = "";
  });

  it("renders all seeded campaigns by default (status filter = all)", () => {
    const { getByTestId } = renderWithProviders(<Campaigns />);

    for (const c of campaignsData.campaigns) {
      expect(getByTestId(`card-campaign-${c.slug}`)).toBeTruthy();
      expect(getByTestId(`text-campaign-name-${c.slug}`).textContent).toBe(c.name);
    }
  });

  it("sorts campaigns newest-first by startDate", () => {
    const { container } = renderWithProviders(<Campaigns />);

    const cards = Array.from(
      container.querySelectorAll('[data-testid^="card-campaign-"]')
    );
    const renderedSlugs = cards.map((el) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- element was matched by its data-testid attribute selector, so it's guaranteed present
      el.getAttribute("data-testid")!.replace("card-campaign-", "")
    );

    const expectedOrder = [...campaignsData.campaigns]
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
      .map((c) => c.slug);

    expect(renderedSlugs).toEqual(expectedOrder);
  });

  it("renders the correct episode count per campaign", () => {
    const { getByTestId } = renderWithProviders(<Campaigns />);

    for (const c of campaignsData.campaigns) {
      const expected = episodesData.episodes.filter(
        (e) => e.campaignSlug === c.slug
      ).length;
      const text = getByTestId(`text-episode-count-${c.slug}`).textContent ?? "";
      expect(text).toContain(String(expected));
    }
  });

  it("renders status badges (active vs concluded)", () => {
    const { getByTestId } = renderWithProviders(<Campaigns />);

    for (const c of campaignsData.campaigns) {
      const badge = getByTestId(`badge-status-${c.slug}`);
      const expectedLabel = c.status === "active" ? "Active" : "Concluded";
      expect(badge.textContent).toBe(expectedLabel);
    }
  });

  it("status filter Active narrows list to active campaigns only", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<Campaigns />);

    fireEvent.click(getByTestId("filter-status-active"));

    for (const c of campaignsData.campaigns) {
      const card = queryByTestId(`card-campaign-${c.slug}`);
      if (c.status === "active") {
        expect(card).toBeTruthy();
      } else {
        expect(card).toBeNull();
      }
    }
  });

  it("status filter Concluded narrows list to concluded campaigns only", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<Campaigns />);

    fireEvent.click(getByTestId("filter-status-concluded"));

    for (const c of campaignsData.campaigns) {
      const card = queryByTestId(`card-campaign-${c.slug}`);
      if (c.status === "concluded") {
        expect(card).toBeTruthy();
      } else {
        expect(card).toBeNull();
      }
    }
  });

  it("clicking a campaign card navigates to /campaigns/<slug>", () => {
    const { getByTestId } = renderWithProviders(<Campaigns />);

    const firstSlug = campaignsData.campaigns[0].slug;
    const card = getByTestId(`card-campaign-${firstSlug}`);
    // The Card is inside a wouter <Link> which renders an <a href="..."> at runtime
    const anchor = card.closest("a");
    expect(anchor).toBeTruthy();
    // wouter <Router base="/"> prepends a leading base segment. We only care that
    // the href ends with /campaigns/<slug> regardless of the test base.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by toBeTruthy() above
    expect(anchor!.getAttribute("href")).toMatch(
      // eslint-disable-next-line security/detect-non-literal-regexp -- firstSlug comes from local test fixture data, not external input
      new RegExp(`/campaigns/${firstSlug}$`)
    );
  });

  it("sets the document title via SEO and emits a BreadcrumbList JSON-LD", () => {
    renderWithProviders(<Campaigns />);

    expect(document.title).toMatch(/Campaigns.*Tales of Aneria/);

    const ldScript = document.querySelector('script[type="application/ld+json"]');
    expect(ldScript).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by toBeTruthy() above
    const parsed = JSON.parse(ldScript!.textContent ?? "{}");
    expect(parsed["@type"]).toBe("BreadcrumbList");
    expect(parsed.itemListElement.length).toBeGreaterThanOrEqual(2);
  });
});
