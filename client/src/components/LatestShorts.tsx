import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Short {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  viewCount?: string;
  publishedAt: string;
}

interface LatestShortsProps {
  channelId?: string;
}

export default function LatestShorts({ channelId }: LatestShortsProps) {
  const { data: shorts, isLoading, error } = useQuery<Short[]>({
    queryKey: ['/api/youtube/channel/shorts', channelId],
    enabled: !!channelId,
    queryFn: async () => {
      console.log('Fetching YouTube Shorts:', channelId);
      const response = await fetch(`/api/youtube/channel/${channelId}/shorts?maxResults=50`);
      if (!response.ok) {
        console.error('Error fetching shorts:', response.statusText);
        return [];
      }
      const videos = await response.json();
      console.log('Shorts response:', videos.length, 'shorts');
      return videos;
    },
  });

  // Display first 5 shorts
  const displayShorts = shorts ? shorts.slice(0, 5) : [];
  
  // Link to YouTube channel shorts page
  const shortsUrl = 'https://www.youtube.com/@TalesOfAneria/shorts';

  return (
    <section id="shorts" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-3" data-testid="text-shorts-title">
              Latest Shorts
            </h2>
            <p className="text-muted-foreground text-lg">
              Quick glimpses into our adventures
            </p>
          </div>
          <Button 
            variant="outline"
            data-testid="button-view-all-shorts"
            onClick={() => window.open(shortsUrl, '_blank', 'noopener,noreferrer')}
          >
            View All Shorts
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[9/16] bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayShorts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {channelId 
                  ? "No shorts found on this channel."
                  : "Configure your YouTube channel ID to display shorts."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayShorts.map((short) => (
              <Card 
                key={short.id} 
                className="overflow-hidden hover-elevate cursor-pointer transition-all"
                data-testid={`card-short-${short.id}`}
                onClick={() => window.open(`https://www.youtube.com/shorts/${short.id}`, '_blank')}
              >
                <div className="relative aspect-[9/16] overflow-hidden">
                  <img
                    src={short.thumbnail}
                    alt={short.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-background/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <Badge className="absolute top-2 left-2 text-xs" data-testid={`badge-short-new-${short.id}`}>
                    Short
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2" data-testid={`text-short-title-${short.id}`}>
                    {short.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span data-testid={`text-duration-${short.id}`}>{short.duration}</span>
                    </div>
                    {short.viewCount && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span data-testid={`text-views-${short.id}`}>{short.viewCount}</span>
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
