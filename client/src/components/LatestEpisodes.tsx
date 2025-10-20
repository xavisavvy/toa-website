import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Eye } from "lucide-react";

interface Episode {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  episodeNumber: number;
}

export default function LatestEpisodes() {
  //todo: remove mock functionality - Replace with actual YouTube API data
  const episodes: Episode[] = [
    {
      id: "1",
      title: "The Awakening",
      thumbnail: "https://images.unsplash.com/photo-1618505722620-e1636d1c0fd8?w=800&auto=format&fit=crop",
      duration: "2:45:30",
      views: "12.5K",
      episodeNumber: 1,
    },
    {
      id: "2",
      title: "Shadows of the Past",
      thumbnail: "https://images.unsplash.com/photo-1549916978-f20e25ba4c5c?w=800&auto=format&fit=crop",
      duration: "3:12:15",
      views: "10.2K",
      episodeNumber: 2,
    },
    {
      id: "3",
      title: "Into the Unknown",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop",
      duration: "2:58:42",
      views: "11.8K",
      episodeNumber: 3,
    },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {episodes.map((episode) => (
            <Card 
              key={episode.id} 
              className="overflow-hidden hover-elevate cursor-pointer transition-all"
              data-testid={`card-episode-${episode.id}`}
              onClick={() => console.log(`Episode ${episode.id} clicked`)}
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
                  Episode {episode.episodeNumber}
                </Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-3" data-testid={`text-episode-title-${episode.id}`}>
                  {episode.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span data-testid={`text-duration-${episode.id}`}>{episode.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span data-testid={`text-views-${episode.id}`}>{episode.views}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
