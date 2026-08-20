import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import CharacterDetail from "@/pages/CharacterDetail";

function renderAt(path: string, ui: ReactElement) {
  const { hook } = memoryLocation({ path });
  return render(<Router hook={hook}>{ui}</Router>);
}

beforeEach(() => {
  document.title = "";
  // remove leftover JSON-LD + meta tags from prior tests so assertions are clean
  document
    .querySelectorAll(
      'script[type="application/ld+json"], meta[property^="og:"], meta[name^="twitter:"]'
    )
    .forEach((s) => s.remove());
});

describe("CharacterDetail — backstory + personality (always render)", () => {
  it("renders Backstory and Personality cards for a known character", () => {
    const { getByTestId } = renderAt(
      "/characters/wayne-archivist",
      <CharacterDetail />
    );
    expect(getByTestId("card-backstory")).toBeTruthy();
    expect(getByTestId("card-personality")).toBeTruthy();
  });
});

describe("CharacterDetail — Motivations / Arc Summary lore (CHAR-01)", () => {
  it("does NOT render Motivations or Arc Summary cards when fields are absent", () => {
    const { queryByTestId } = renderAt(
      "/characters/wayne-archivist",
      <CharacterDetail />
    );
    // No real character has motivations or arcSummary populated in v1.
    expect(queryByTestId("card-motivations")).toBeNull();
    expect(queryByTestId("card-arc-summary")).toBeNull();
  });
});

describe("CharacterDetail — Gallery AI badge + legend (CHAR-02)", () => {
  it("renders the AI corner badge with aria-label='AI-generated image' when an image is AI-generated", () => {
    const { container, getByTestId } = renderAt(
      "/characters/winifred-fred-blodbane",
      <CharacterDetail />
    );
    // Gallery AI badges have data-testid="badge-ai-{image.id}"; we filter
    // out the hero featured-AI badge ("badge-ai-featured") which is a
    // separate, pre-existing tooltip-driven badge with different a11y semantics.
    const aiBadges = Array.from(
      container.querySelectorAll('[data-testid^="badge-ai-"]')
    ).filter(
      (el) => el.getAttribute("data-testid") !== "badge-ai-featured"
    );
    expect(aiBadges.length).toBeGreaterThan(0);
    aiBadges.forEach((badge) => {
      expect(badge.getAttribute("aria-label")).toBe("AI-generated image");
      expect(badge.getAttribute("role")).toBe("img");
    });
    // Page-level legend appears when at least one image is AI-generated
    expect(getByTestId("text-ai-legend")).toBeTruthy();
  });

  it("does NOT render the AI legend when no image is AI-generated", () => {
    const { queryByTestId } = renderAt(
      "/characters/wayne-archivist",
      <CharacterDetail />
    );
    expect(queryByTestId("text-ai-legend")).toBeNull();
  });
});

describe("CharacterDetail — Source badge (Official / Fan) (CHAR-02)", () => {
  it("renders an Official Art badge for every gallery image with a non-empty url", () => {
    const { container } = renderAt(
      "/characters/wayne-archivist",
      <CharacterDetail />
    );
    const badges = container.querySelectorAll(
      '[data-testid^="badge-source-"]'
    );
    expect(badges.length).toBeGreaterThan(0);
    badges.forEach((badge) => {
      expect(badge.textContent).toContain("Official Art");
    });
  });
});

describe("CharacterDetail — og:image safety + Person JSON-LD (CHAR-03 + CHAR-04)", () => {
  it("emits Person JSON-LD inside @graph when playerId resolves to a cast member (wayne-archivist)", async () => {
    renderAt("/characters/wayne-archivist", <CharacterDetail />);
    // SEO useEffect injects the script asynchronously
    await new Promise((r) => setTimeout(r, 0));

    const ld = document.querySelector('script[type="application/ld+json"]');
    expect(ld).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by toBeTruthy() above
    const parsed = JSON.parse(ld!.textContent ?? "{}");
    expect(parsed["@graph"]).toBeDefined();
    const graph = parsed["@graph"] as Array<{ "@type": string; name?: string }>;
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("CreativeWork");
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("Person");
    const person = graph.find((n) => n["@type"] === "Person");
    expect(person?.name).toBe("Preston Farr");
  });

  it("does NOT emit Person JSON-LD when playerId is the 'tbd' placeholder (holiday-special-1)", async () => {
    renderAt("/characters/holiday-special-1", <CharacterDetail />);
    await new Promise((r) => setTimeout(r, 0));

    const ld = document.querySelector('script[type="application/ld+json"]');
    expect(ld).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by toBeTruthy() above
    const parsed = JSON.parse(ld!.textContent ?? "{}");
    const graph = parsed["@graph"] as Array<{ "@type": string }>;
    const types = graph.map((n) => n["@type"]);
    expect(types).not.toContain("Person");
    expect(types).toContain("CreativeWork");
    expect(types).toContain("BreadcrumbList");
  });

  it("falls back to the site default og:image when featuredImage is empty (eve-faraque)", async () => {
    renderAt("/characters/eve-faraque", <CharacterDetail />);
    await new Promise((r) => setTimeout(r, 0));

    const ogImage = document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content");
    // SEO.tsx default ogImage is 'https://talesofaneria.com/og-image.png'
    expect(ogImage).toBe("https://talesofaneria.com/og-image.png");
  });

  it("uses the character featuredImage as og:image when present (wayne-archivist)", async () => {
    renderAt("/characters/wayne-archivist", <CharacterDetail />);
    await new Promise((r) => setTimeout(r, 0));

    const ogImage = document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content");
    expect(ogImage).toBe(
      "https://talesofaneria.com/characters/wayne-archivist.webp"
    );
  });
});
