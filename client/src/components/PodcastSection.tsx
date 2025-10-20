import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, ExternalLink } from "lucide-react";
import { SiSpotify, SiApplepodcasts } from "react-icons/si";

interface PodcastEpisode {
  id: string;
  title: string;
  date: string;
  duration: string;
}

export default function PodcastSection() {
  //todo: remove mock functionality - Replace with actual podcast RSS feed data
  const featuredEpisode = {
    title: "Behind the Scenes: Creating Aneria",
    description: "Join our game master as they discuss the world-building process and share exclusive insights into the creation of Aneria's rich lore and mythology.",
    date: "Jan 15, 2024",
    duration: "45:22",
  };

  const recentEpisodes: PodcastEpisode[] = [
    { id: "1", title: "Character Deep Dive: The Shadowmancer", date: "Jan 8, 2024", duration: "38:15" },
    { id: "2", title: "Campaign Recap: Arc One", date: "Jan 1, 2024", duration: "52:40" },
    { id: "3", title: "Player Interview: Journey So Far", date: "Dec 25, 2023", duration: "41:30" },
  ];

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
              <p className="text-muted-foreground mb-6" data-testid="text-featured-description">
                {featuredEpisode.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span data-testid="text-featured-date">{featuredEpisode.date}</span>
                <span>•</span>
                <span data-testid="text-featured-duration">{featuredEpisode.duration}</span>
              </div>
              <div className="h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                Audio Player Placeholder
              </div>
              <div className="flex items-center gap-3 mt-6">
                <span className="text-sm text-muted-foreground">Listen on:</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  data-testid="button-spotify"
                  onClick={() => console.log('Open Spotify')}
                >
                  <SiSpotify className="h-4 w-4 mr-2" />
                  Spotify
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  data-testid="button-apple-podcasts"
                  onClick={() => console.log('Open Apple Podcasts')}
                >
                  <SiApplepodcasts className="h-4 w-4 mr-2" />
                  Apple
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-xl mb-4" data-testid="text-recent-episodes">
              Recent Episodes
            </h3>
            {recentEpisodes.map((episode) => (
              <Card 
                key={episode.id}
                className="hover-elevate cursor-pointer transition-all"
                data-testid={`card-podcast-${episode.id}`}
                onClick={() => console.log(`Podcast episode ${episode.id} clicked`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2" data-testid={`text-podcast-title-${episode.id}`}>
                        {episode.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span data-testid={`text-podcast-date-${episode.id}`}>{episode.date}</span>
                        <span>•</span>
                        <span data-testid={`text-podcast-duration-${episode.id}`}>{episode.duration}</span>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      data-testid={`button-play-podcast-${episode.id}`}
                    >
                      <Headphones className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
