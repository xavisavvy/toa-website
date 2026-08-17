import { SiSpotify, SiApplepodcasts, SiYoutubemusic } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";

interface PodcastSubscribeStripProps {
  spotifyUrl?: string;
  applePodcastsUrl?: string;
  youtubeMusicUrl?: string;
  className?: string;
  /**
   * Optional id suffix for data-testid uniqueness when used multiple times on
   * the same page (defaults preserve the existing PodcastSection testids:
   * `button-spotify`, `button-apple-podcasts`, `button-youtube-music`).
   */
  testIdSuffix?: string;
  /** When true, fires analytics.podcastPlay on click (parity with PodcastSection). */
  trackAnalytics?: boolean;
  /** Optional label rendered before the buttons (defaults to "Listen on:"). */
  label?: string | null;
}

/**
 * Reusable Spotify / Apple Podcasts / YouTube Music subscribe button row.
 *
 * Extracted from PodcastSection.tsx so the new /podcast page can reuse it.
 * Buttons render disabled when their URL prop is unset (matches existing
 * behavior). All anchors open in a new tab with rel="noopener noreferrer"
 * via window.open with the safe rel string.
 */
export default function PodcastSubscribeStrip({
  spotifyUrl,
  applePodcastsUrl,
  youtubeMusicUrl,
  className,
  testIdSuffix,
  trackAnalytics = false,
  label = "Listen on:",
}: PodcastSubscribeStripProps) {
  const suffix = testIdSuffix ? `-${testIdSuffix}` : "";

  const open = (url: string | undefined, platform: string) => {
    if (!url) {
      return;
    }
    if (trackAnalytics) {
      analytics.podcastPlay(platform);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={
        className ?? "flex items-center gap-3 flex-wrap"
      }
      data-testid={`podcast-subscribe-strip${suffix}`}
    >
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        data-testid={`button-spotify${suffix}`}
        onClick={() => open(spotifyUrl, "Spotify")}
        disabled={!spotifyUrl}
      >
        <SiSpotify className="h-4 w-4 mr-2" />
        Spotify
      </Button>
      <Button
        size="sm"
        variant="outline"
        data-testid={`button-apple-podcasts${suffix}`}
        onClick={() => open(applePodcastsUrl, "Apple Podcasts")}
        disabled={!applePodcastsUrl}
      >
        <SiApplepodcasts className="h-4 w-4 mr-2" />
        Apple
      </Button>
      <Button
        size="sm"
        variant="outline"
        data-testid={`button-youtube-music${suffix}`}
        onClick={() => open(youtubeMusicUrl, "YouTube Music")}
        disabled={!youtubeMusicUrl}
      >
        <SiYoutubemusic className="h-4 w-4 mr-2" />
        YouTube Music
      </Button>
    </div>
  );
}
