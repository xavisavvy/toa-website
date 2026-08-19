import type { Campaign, Episode } from "@shared/schema";
import { describe, it, expect } from "vitest";

import {
  youtubeIdFromUrl,
  youtubeThumbnail,
  getPlaylistIdFromUrl,
  getCampaignBySlug,
  getEpisodesByCampaign,
  sortCampaignsByStartDateDesc,
} from "@/lib/campaigns";

describe("youtubeIdFromUrl", () => {
  it("parses youtu.be short URLs", () => {
    expect(youtubeIdFromUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses youtube.com/watch?v= URLs", () => {
    expect(youtubeIdFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("parses youtube.com/watch?v= URLs with extra query params", () => {
    expect(
      youtubeIdFromUrl("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=10s")
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses youtube.com/embed/ URLs", () => {
    expect(youtubeIdFromUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("returns null for non-YouTube URLs", () => {
    expect(youtubeIdFromUrl("https://vimeo.com/12345")).toBeNull();
    expect(youtubeIdFromUrl("https://example.com/watch?v=abcdef")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(youtubeIdFromUrl("")).toBeNull();
    expect(youtubeIdFromUrl(undefined)).toBeNull();
    expect(youtubeIdFromUrl(null)).toBeNull();
    expect(youtubeIdFromUrl("not a url")).toBeNull();
  });
});

describe("youtubeThumbnail", () => {
  it("returns hqdefault.jpg URL when id is parseable", () => {
    expect(youtubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    );
  });

  it("returns undefined when id can't be parsed", () => {
    expect(youtubeThumbnail("https://example.com")).toBeUndefined();
    expect(youtubeThumbnail("")).toBeUndefined();
    expect(youtubeThumbnail(undefined)).toBeUndefined();
  });
});

describe("getPlaylistIdFromUrl", () => {
  it("extracts the playlist id from a playlist URL", () => {
    expect(
      getPlaylistIdFromUrl(
        "https://www.youtube.com/playlist?list=PLPwB6km-TpoAQiDKQnXQW-JUUXBwvkFQY"
      )
    ).toBe("PLPwB6km-TpoAQiDKQnXQW-JUUXBwvkFQY");
  });

  it("extracts the playlist id when list= is one of several query params", () => {
    expect(
      getPlaylistIdFromUrl(
        "https://www.youtube.com/watch?v=abcdefghijk&list=PLxyz123&index=2"
      )
    ).toBe("PLxyz123");
  });

  it("returns null for a single-video URL with no list param", () => {
    expect(
      getPlaylistIdFromUrl("https://www.youtube.com/watch?v=GzMnW52hmP4")
    ).toBeNull();
  });

  it("returns null for a non-YouTube URL", () => {
    expect(
      getPlaylistIdFromUrl("https://www.worldanvil.com/w/aneria-niburu")
    ).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(getPlaylistIdFromUrl("")).toBeNull();
    expect(getPlaylistIdFromUrl(undefined)).toBeNull();
    expect(getPlaylistIdFromUrl(null)).toBeNull();
  });
});

const fixtureCampaigns: Campaign[] = [
  {
    slug: "saga-a",
    name: "Saga A",
    summary: "First saga",
    description: "An old saga",
    status: "concluded",
    startDate: "2022-01-15",
    endDate: "2023-06-30",
    cast: ["preston-farr"],
  },
  {
    slug: "saga-b",
    name: "Saga B",
    summary: "Newest saga",
    description: "An ongoing saga",
    status: "active",
    startDate: "2024-09-01",
    cast: ["cory-avis", "preston-farr"],
  },
  {
    slug: "saga-c",
    name: "Saga C",
    summary: "Mid saga",
    description: "A middle-era saga",
    status: "concluded",
    startDate: "2023-04-10",
    endDate: "2024-02-01",
    cast: ["torrey-woolsey"],
  },
];

const fixtureEpisodes: Episode[] = [
  {
    id: "saga-b-2",
    campaignSlug: "saga-b",
    episodeNumber: 2,
    title: "Saga B Ep 2",
    summary: "Second outing",
    airDate: "2024-09-15",
    youtubeUrl: "https://www.youtube.com/watch?v=PLACEHOLDER2",
  },
  {
    id: "saga-b-1",
    campaignSlug: "saga-b",
    episodeNumber: 1,
    title: "Saga B Ep 1",
    summary: "Pilot",
    airDate: "2024-09-01",
    youtubeUrl: "https://www.youtube.com/watch?v=PLACEHOLDER1",
  },
  {
    id: "saga-a-1",
    campaignSlug: "saga-a",
    episodeNumber: 1,
    title: "Saga A Ep 1",
    summary: "First saga pilot",
    airDate: "2022-01-15",
    youtubeUrl: "https://www.youtube.com/watch?v=PLACEHOLDER_A1",
  },
];

describe("getCampaignBySlug", () => {
  it("returns the matching campaign", () => {
    expect(getCampaignBySlug(fixtureCampaigns, "saga-b")?.name).toBe("Saga B");
  });

  it("returns undefined for unknown slug", () => {
    expect(getCampaignBySlug(fixtureCampaigns, "does-not-exist")).toBeUndefined();
  });

  it("returns undefined when slug is undefined or null", () => {
    expect(getCampaignBySlug(fixtureCampaigns, undefined)).toBeUndefined();
    expect(getCampaignBySlug(fixtureCampaigns, null)).toBeUndefined();
  });
});

describe("getEpisodesByCampaign", () => {
  it("returns episodes for the slug, sorted ascending by episodeNumber", () => {
    const result = getEpisodesByCampaign(fixtureEpisodes, "saga-b");
    expect(result).toHaveLength(2);
    expect(result[0].episodeNumber).toBe(1);
    expect(result[1].episodeNumber).toBe(2);
  });

  it("returns empty array for unknown slug", () => {
    expect(getEpisodesByCampaign(fixtureEpisodes, "ghost-saga")).toEqual([]);
  });

  it("returns empty array when slug is undefined", () => {
    expect(getEpisodesByCampaign(fixtureEpisodes, undefined)).toEqual([]);
  });

  it("does not mutate input", () => {
    const before = [...fixtureEpisodes];
    getEpisodesByCampaign(fixtureEpisodes, "saga-b");
    expect(fixtureEpisodes).toEqual(before);
  });
});

describe("sortCampaignsByStartDateDesc", () => {
  it("sorts newest-first by startDate", () => {
    const result = sortCampaignsByStartDateDesc(fixtureCampaigns);
    expect(result.map((c) => c.slug)).toEqual(["saga-b", "saga-c", "saga-a"]);
  });

  it("does not mutate the input array", () => {
    const before = fixtureCampaigns.map((c) => c.slug);
    sortCampaignsByStartDateDesc(fixtureCampaigns);
    expect(fixtureCampaigns.map((c) => c.slug)).toEqual(before);
  });

  it("preserves stable order for equal startDates", () => {
    const tied: Campaign[] = [
      { ...fixtureCampaigns[0], slug: "alpha", startDate: "2024-01-01" },
      { ...fixtureCampaigns[0], slug: "beta", startDate: "2024-01-01" },
      { ...fixtureCampaigns[0], slug: "gamma", startDate: "2024-01-01" },
    ];
    expect(sortCampaignsByStartDateDesc(tied).map((c) => c.slug)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });
});
