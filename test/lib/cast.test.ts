import { describe, it, expect } from "vitest";

import { getCastMemberById, getCastSocialUrls } from "@/lib/cast";

describe("getCastMemberById", () => {
  it("returns the cast entry whose id matches a known playerId", () => {
    const preston = getCastMemberById("preston-farr");
    expect(preston).toBeDefined();
    expect(preston?.name).toBe("Preston Farr");
  });

  it("returns undefined for an unknown playerId", () => {
    expect(getCastMemberById("does-not-exist")).toBeUndefined();
  });

  it("returns undefined for the documented 'tbd' placeholder", () => {
    expect(getCastMemberById("tbd")).toBeUndefined();
  });

  it("returns undefined for an undefined input", () => {
    expect(getCastMemberById(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty-string input", () => {
    expect(getCastMemberById("")).toBeUndefined();
  });
});

describe("getCastSocialUrls", () => {
  it("returns 5 populated social URLs for Preston (full set)", () => {
    const preston = getCastMemberById("preston-farr");
    expect(preston).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by toBeDefined() above
    const urls = getCastSocialUrls(preston!.socialLinks);
    expect(urls).toHaveLength(5);
    expect(urls).toContain("https://prestonfarr.com");
    expect(urls).toContain("https://www.youtube.com/@fuzzysquirrel");
  });

  it("returns 0 social URLs for Cory (all empty)", () => {
    const cory = getCastMemberById("cory-avis");
    expect(cory).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- presence verified by toBeDefined() above
    const urls = getCastSocialUrls(cory!.socialLinks);
    expect(urls).toEqual([]);
  });

  it("filters empty strings and preserves insertion order", () => {
    const fixture: Record<string, string> = {
      youtube: "https://yt.example",
      twitter: "",
      instagram: "https://ig.example",
      twitch: "",
      website: "https://web.example",
    };
    const urls = getCastSocialUrls(fixture);
    expect(urls).toEqual([
      "https://yt.example",
      "https://ig.example",
      "https://web.example",
    ]);
  });
});
