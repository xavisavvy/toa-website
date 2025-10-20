import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Swords, Scroll, ExternalLink } from "lucide-react";

interface WorldAspect {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

export default function WorldSection() {
  const worldAnvilUrl = "https://www.worldanvil.com/w/aneria-niburu";
  
  const worldAspects: WorldAspect[] = [
    {
      id: "characters",
      icon: <Users className="h-8 w-8" />,
      title: "Characters",
      description: "Meet the heroes, villains, and legendary figures that shape the fate of Aneria",
      link: worldAnvilUrl,
    },
    {
      id: "locations",
      icon: <MapPin className="h-8 w-8" />,
      title: "Locations",
      description: "Explore mystical cities, ancient ruins, and hidden sanctuaries across the realm",
      link: worldAnvilUrl,
    },
    {
      id: "factions",
      icon: <Swords className="h-8 w-8" />,
      title: "Factions",
      description: "Discover the powerful organizations vying for control of Aneria's destiny",
      link: worldAnvilUrl,
    },
    {
      id: "lore",
      icon: <Scroll className="h-8 w-8" />,
      title: "Lore & History",
      description: "Uncover the rich tapestry of myths, legends, and historical events",
      link: worldAnvilUrl,
    },
  ];

  return (
    <section id="lore" className="py-20 lg:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-4" data-testid="text-world-title">
            The World of Aneria
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            A realm steeped in magic and mystery, where ancient powers awaken and heroes rise to face unimaginable challenges
          </p>
          <Button 
            variant="outline"
            data-testid="button-worldanvil"
            onClick={() => window.open(worldAnvilUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Explore on WorldAnvil
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {worldAspects.map((aspect) => (
            <Card
              key={aspect.id}
              className="hover-elevate cursor-pointer transition-all"
              data-testid={`card-world-${aspect.id}`}
              onClick={() => window.open(aspect.link, '_blank', 'noopener,noreferrer')}
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  {aspect.icon}
                </div>
                <h3 className="font-semibold text-xl mb-3" data-testid={`text-world-${aspect.id}-title`}>
                  {aspect.title}
                </h3>
                <p className="text-muted-foreground text-sm" data-testid={`text-world-${aspect.id}-description`}>
                  {aspect.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
