import { useQuery } from "@tanstack/react-query";
import { Headphones } from "lucide-react";
import { SiSpotify, SiApplepodcasts, SiYoutubemusic } from "react-icons/si";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration?: string;
  audioUrl?: string;
  link?: string;
}

interface PodcastSectionProps {
  feedUrl?: string;
  spotifyUrl?: string;
  applePodcastsUrl?: string;
  youtubeMusicUrl?: string;
}

export default function PodcastSection({ feedUrl, spotifyUrl, applePodcastsUrl, youtubeMusicUrl }: PodcastSectionProps) {
  const { data: episodes, isLoading } = useQuery<PodcastEpisode[]>({
    queryKey: ['/api/podcast/feed', feedUrl],
    queryFn: async () => {
      if (!feedUrl) {return [];}
      const response = await fetch('/api/podcast/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl, limit: 5 }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch podcast feed');
      }
      return response.json();
    },
    enabled: !!feedUrl,
  });

  const featuredEpisode = episodes?.[0];
  const recentEpisodes = (episodes || []).slice(1, 4);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <section id="podcast" className="py-20 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-3" data-testid="text-podcast-title">
            Podcast
          </h2>
          <p className="text-muted-foreground text-lg">
            Dive deeper into the world of Aneria with exclusive content
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-8">
                <div className="h-6 bg-muted rounded animate-pulse mb-4 w-32" />
                <div className="h-8 bg-muted rounded animate-pulse mb-4" />
                <div className="h-20 bg-muted rounded animate-pulse mb-6" />
                <div className="h-4 bg-muted rounded animate-pulse w-48 mb-6" />
                <div className="h-12 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : !feedUrl || !featuredEpisode ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {feedUrl 
                  ? "No podcast episodes found."
                  : "Configure your podcast RSS feed URL to display episodes."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden" data-testid="card-featured-episode">
              <CardContent className="p-8">
                <Badge className="mb-4" data-testid="badge-featured">
                  <Headphones className="h-3 w-3 mr-1" />
                  Featured Episode
                </Badge>
                <h3 className="font-serif text-2xl font-semibold mb-4" data-testid="text-featured-title">
                  {featuredEpisode.title}
                </h3>
                <p className="text-muted-foreground mb-6 line-clamp-3" data-testid="text-featured-description">
                  {featuredEpisode.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span data-testid="text-featured-date">{formatDate(featuredEpisode.pubDate)}</span>
                  {featuredEpisode.duration && (
                    <>
                      <span>•</span>
                      <span data-testid="text-featured-duration">{featuredEpisode.duration}</span>
                    </>
                  )}
                </div>
                {featuredEpisode.audioUrl ? (
                  <audio 
                    controls 
                    className="w-full mb-6"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Audio playback error:', e);
                      console.log('Audio URL:', featuredEpisode.audioUrl);
                    }}
                    onLoadedMetadata={() => console.log('Audio loaded successfully')}
                  >
                    <source src={`/api/podcast/audio-proxy?url=${encodeURIComponent(featuredEpisode.audioUrl)}`} type="audio/mpeg" />
                    <source src={`/api/podcast/audio-proxy?url=${encodeURIComponent(featuredEpisode.audioUrl)}`} type="audio/mp4" />
                    <source src={`/api/podcast/audio-proxy?url=${encodeURIComponent(featuredEpisode.audioUrl)}`} type="audio/x-m4a" />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <div className="h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground mb-6">
                    Audio Player Placeholder
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">Listen on:</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid="button-spotify"
                    onClick={() => spotifyUrl && window.open(spotifyUrl, '_blank')}
                    disabled={!spotifyUrl}
                  >
                    <SiSpotify className="h-4 w-4 mr-2" />
                    Spotify
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid="button-apple-podcasts"
                    onClick={() => applePodcastsUrl && window.open(applePodcastsUrl, '_blank')}
                    disabled={!applePodcastsUrl}
                  >
                    <SiApplepodcasts className="h-4 w-4 mr-2" />
                    Apple
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid="button-youtube-music"
                    onClick={() => youtubeMusicUrl && window.open(youtubeMusicUrl, '_blank')}
                    disabled={!youtubeMusicUrl}
                  >
                    <SiYoutubemusic className="h-4 w-4 mr-2" />
                    YouTube Music
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-xl mb-4" data-testid="text-recent-episodes">
                Recent Episodes
              </h3>
              {recentEpisodes.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No additional episodes available
                  </CardContent>
                </Card>
              ) : (
                recentEpisodes.map((episode: PodcastEpisode) => (
                  <Card 
                    key={episode.id}
                    className="hover-elevate transition-all"
                    data-testid={`card-podcast-${episode.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2 line-clamp-2" data-testid={`text-podcast-title-${episode.id}`}>
                              {episode.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span data-testid={`text-podcast-date-${episode.id}`}>{formatDate(episode.pubDate)}</span>
                              {episode.duration && (
                                <>
                                  <span>•</span>
                                  <span data-testid={`text-podcast-duration-${episode.id}`}>{episode.duration}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Listen on:</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            data-testid={`button-spotify-${episode.id}`}
                            onClick={() => spotifyUrl && window.open(spotifyUrl, '_blank')}
                            disabled={!spotifyUrl}
                          >
                            <SiSpotify className="h-3 w-3 mr-1" />
                            Spotify
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            data-testid={`button-apple-${episode.id}`}
                            onClick={() => applePodcastsUrl && window.open(applePodcastsUrl, '_blank')}
                            disabled={!applePodcastsUrl}
                          >
                            <SiApplepodcasts className="h-3 w-3 mr-1" />
                            Apple
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            data-testid={`button-youtube-music-${episode.id}`}
                            onClick={() => youtubeMusicUrl && window.open(youtubeMusicUrl, '_blank')}
                            disabled={!youtubeMusicUrl}
                          >
                            <SiYoutubemusic className="h-3 w-3 mr-1" />
                            YouTube Music
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
