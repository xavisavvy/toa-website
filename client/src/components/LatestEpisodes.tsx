import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Episode {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  viewCount?: string;
  publishedAt: string;
}

interface LatestEpisodesProps {
  playlistId?: string;
}

export default function LatestEpisodes({ playlistId }: LatestEpisodesProps) {
  const { data: episodes, isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/youtube/playlist', playlistId],
    enabled: !!playlistId,
  });

  const displayEpisodes = episodes?.slice(0, 3) || [];

  return (
    <section id="episodes" className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-3" data-testid="text-episodes-title">
              Latest Episodes
            </h2>
            <p className="text-muted-foreground text-lg">
              Catch up on our most recent adventures
            </p>
          </div>
          <Button 
            variant="outline"
            data-testid="button-view-all-episodes"
            onClick={() => console.log('View all episodes clicked')}
          >
            View All Episodes
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded animate-pulse mb-3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayEpisodes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {playlistId 
                  ? "No episodes found in this playlist."
                  : "Configure your YouTube playlist ID to display episodes."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayEpisodes.map((episode, index) => (
              <Card 
                key={episode.id} 
                className="overflow-hidden hover-elevate cursor-pointer transition-all"
                data-testid={`card-episode-${episode.id}`}
                onClick={() => window.open(`https://www.youtube.com/watch?v=${episode.id}`, '_blank')}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-background/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 left-3" data-testid={`badge-episode-number-${episode.id}`}>
                    Episode {index + 1}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-xl mb-3 line-clamp-2" data-testid={`text-episode-title-${episode.id}`}>
                    {episode.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span data-testid={`text-duration-${episode.id}`}>{episode.duration}</span>
                    </div>
                    {episode.viewCount && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span data-testid={`text-views-${episode.id}`}>{episode.viewCount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
