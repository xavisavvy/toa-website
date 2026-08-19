import { useQuery } from "@tanstack/react-query";
import { Headphones } from "lucide-react";
import { SiSpotify, SiApplepodcasts, SiYoutubemusic } from "react-icons/si";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import PodcastSubscribeStrip from "@/components/PodcastSubscribeStrip";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBreadcrumbSchema } from "@/lib/structuredData";

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration?: string;
  audioUrl?: string;
  link?: string;
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default function Podcast() {
  const feedUrl = import.meta.env.VITE_PODCAST_FEED_URL as string | undefined;
  const spotifyUrl = import.meta.env.VITE_PODCAST_SPOTIFY_URL as
    | string
    | undefined;
  const applePodcastsUrl = import.meta.env.VITE_PODCAST_APPLE_URL as
    | string
    | undefined;
  const youtubeMusicUrl = import.meta.env.VITE_PODCAST_YOUTUBE_MUSIC_URL as
    | string
    | undefined;

  const {
    data: episodes,
    isLoading,
    isError,
  } = useQuery<PodcastEpisode[]>({
    // Distinct cache key from PodcastSection's ['/api/podcast/feed', feedUrl]
    // (which fetches limit:5).
    queryKey: ["/api/podcast/feed/full", feedUrl],
    enabled: !!feedUrl,
    queryFn: async () => {
      const r = await fetch("/api/podcast/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Must not exceed the cap in server/routes.ts POST
        // /api/podcast/feed (200). 500 silently 400'd this whole page.
        body: JSON.stringify({ feedUrl, limit: 200 }),
      });
      if (!r.ok) {
        throw new Error("Failed to fetch podcast feed");
      }
      return r.json();
    },
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Podcast", url: "https://talesofaneria.com/podcast" },
  ]);

  // Pick a fallback platform URL for the error-state CTA: first non-empty.
  const fallbackPlatformUrl =
    spotifyUrl || applePodcastsUrl || youtubeMusicUrl || undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Podcast - Tales of Aneria"
        description="Every episode of the Tales of Aneria podcast — newest first."
        canonical="https://talesofaneria.com/podcast"
        keywords="Tales of Aneria podcast, TTRPG podcast, D&D podcast, Spotify, Apple Podcasts, YouTube Music"
        jsonLd={breadcrumbData}
      />
      <Navigation />
      <div className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Headphones className="h-8 w-8" />
            </div>
            <h1
              className="font-serif text-4xl md:text-5xl font-semibold mb-6"
              data-testid="text-page-title"
            >
              Podcast
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-3xl mx-auto"
              data-testid="text-page-description"
            >
              Every episode of the Tales of Aneria podcast — newest first.
            </p>
          </div>

          {/* Top subscribe strip */}
          <div className="mb-12 flex justify-center">
            <PodcastSubscribeStrip
              spotifyUrl={spotifyUrl}
              applePodcastsUrl={applePodcastsUrl}
              youtubeMusicUrl={youtubeMusicUrl}
              testIdSuffix="top"
            />
          </div>

          {isLoading ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-3" />
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card data-testid="card-error-state" className="max-w-3xl mx-auto">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Couldn&apos;t load podcast episodes right now — check back
                  soon.
                </p>
                {fallbackPlatformUrl ? (
                  <Button
                    variant="outline"
                    data-testid="button-error-podcast-platform"
                    onClick={() =>
                      window.open(
                        fallbackPlatformUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Listen on a podcast platform
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : !episodes || episodes.length === 0 ? (
            <p
              className="text-center text-muted-foreground"
              data-testid="text-empty-state"
            >
              No podcast episodes available.
            </p>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {episodes.map((episode) => (
                <Card
                  key={episode.id}
                  className="hover-elevate transition-all"
                  data-testid={`card-podcast-${episode.id}`}
                >
                  <CardContent className="p-6">
                    <h3
                      className="font-semibold text-xl mb-2 line-clamp-2"
                      data-testid={`text-podcast-title-${episode.id}`}
                    >
                      {episode.title}
                    </h3>
                    <p
                      className="text-muted-foreground mb-3 line-clamp-3"
                      data-testid={`text-podcast-description-${episode.id}`}
                    >
                      {episode.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mb-4">
                      <span data-testid={`text-podcast-date-${episode.id}`}>
                        {formatDate(episode.pubDate)}
                      </span>
                      {episode.duration ? (
                        <>
                          <span aria-hidden="true">•</span>
                          <span
                            data-testid={`text-podcast-duration-${episode.id}`}
                          >
                            {episode.duration}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Listen on:
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        asChild
                        disabled={!spotifyUrl}
                        data-testid={`link-podcast-spotify-${episode.id}`}
                      >
                        {spotifyUrl ? (
                          <a
                            href={spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <SiSpotify className="h-3 w-3 mr-1" />
                            Spotify
                          </a>
                        ) : (
                          <span aria-disabled="true">
                            <SiSpotify className="h-3 w-3 mr-1" />
                            Spotify
                          </span>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        asChild
                        disabled={!applePodcastsUrl}
                        data-testid={`link-podcast-apple-${episode.id}`}
                      >
                        {applePodcastsUrl ? (
                          <a
                            href={applePodcastsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <SiApplepodcasts className="h-3 w-3 mr-1" />
                            Apple
                          </a>
                        ) : (
                          <span aria-disabled="true">
                            <SiApplepodcasts className="h-3 w-3 mr-1" />
                            Apple
                          </span>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        asChild
                        disabled={!youtubeMusicUrl}
                        data-testid={`link-podcast-youtube-music-${episode.id}`}
                      >
                        {youtubeMusicUrl ? (
                          <a
                            href={youtubeMusicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <SiYoutubemusic className="h-3 w-3 mr-1" />
                            YouTube Music
                          </a>
                        ) : (
                          <span aria-disabled="true">
                            <SiYoutubemusic className="h-3 w-3 mr-1" />
                            YouTube Music
                          </span>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
