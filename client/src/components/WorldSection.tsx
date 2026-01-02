import { Globe, Skull, Sparkles, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type React from "react";

import taebrinBg from "@/assets/creepy-forest.webp";
import aneriaBg from "@/assets/feat-aneria.webp";
import pterrordaleBg from "@/assets/feat-pterrordale.webp";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import charactersData from "@/data/characters.json";

interface Campaign {
  name: string;
  description: string;
}

interface CampaignWorld {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  campaigns: Campaign[];
  comingSoon?: boolean;
  link: string;
  backgroundImage?: string;
}

interface Character {
  id: string;
  name: string;
  campaign: string;
  featuredImage: string;
  status: string;
}

interface CharacterCarouselProps {
  worldId: string;
}

function CharacterCarousel({ worldId }: CharacterCarouselProps) {
  const getCampaignMatch = (worldId: string): string[] => {
    switch (worldId) {
      case "aneria":
        return ["Aneria - Wayward Watch"];
      case "pterrordale":
        return ["Pterrordale"];
      case "taebrin":
        return ["Journeys Through Taebrin"];
      default:
        return [];
    }
  };

  const campaignNames = getCampaignMatch(worldId);
  const characters = (charactersData.characters as Character[]).filter((char) =>
    campaignNames.includes(char.campaign),
  );

  if (characters.length === 0) {
    return null;
  }

  const shouldScroll = characters.length > 5;
  const displayCharacters = shouldScroll
    ? [...characters, ...characters]
    : characters;

  return (
    <div className="pt-4 border-t border-border/50">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-3">
        Characters
      </h4>
      <div className="relative overflow-hidden">
        <div
          className={`flex gap-2 ${shouldScroll ? "animate-scroll" : "flex-wrap"}`}
          style={{
            animation: shouldScroll ? "scroll 20s linear infinite" : "none",
          }}
        >
          {displayCharacters.map((char, idx) => (
            <div
              key={`${char.id}-${idx}`}
              className="flex-shrink-0"
              data-testid={`avatar-${worldId}-${char.id}`}
            >
              <Avatar className="w-12 h-12 border-2 border-border">
                <AvatarImage src={char.featuredImage} alt={char.name} loading="lazy" />
                <AvatarFallback className="text-xs">
                  {char.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

interface LazyBackgroundImageProps {
  src: string;
  alt: string;
  className?: string;
}

function LazyBackgroundImage({ src, alt, className }: LazyBackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) {return;}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before element enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [isInView, isLoaded, src]);

  return (
    <div ref={imgRef} className="absolute inset-0">
      {isLoaded && (
        <img
          src={src}
          alt={alt}
          className={className}
        />
      )}
    </div>
  );
}

export default function WorldSection() {
  const worldAnvilUrl = "https://www.worldanvil.com/w/aneria-niburu";

  const campaignWorlds: CampaignWorld[] = [
    {
      id: "aneria",
      name: "Aneria",
      icon: <Globe className="h-8 w-8" />,
      description:
        "A realm steeped in magic and mystery, where ancient powers awaken and heroes rise to face unimaginable challenges",
      campaigns: [
        {
          name: "The Wayward Watch",
          description: "The primary campaign spanning Seasons 1 & 2",
        },
        {
          name: "Littlest Hopes",
          description: "Side quest campaign with overlapping storylines",
        },
      ],
      link: worldAnvilUrl,
      backgroundImage: aneriaBg,
    },
    {
      id: "pterrordale",
      name: "Pterrordale",
      icon: <Skull className="h-8 w-8" />,
      description:
        "A modern Halloween special setting filled with magic, intrigue, and horror in the unfortunate town of Pterrordale",
      campaigns: [
        {
          name: "S.A.S.S",
          description: "High school students investigating the supernatural",
        },
      ],
      link: "https://www.youtube.com/watch?v=GzMnW52hmP4",
      backgroundImage: pterrordaleBg,
    },
    {
      id: "taebrin",
      name: "Journeys Through Taebrin",
      icon: <Sparkles className="h-8 w-8" />,
      description:
        "A bronze age themed land inhabited by the ancient Saurian people, where dinosaur civilizations thrive",
      campaigns: [],
      comingSoon: false,
      link: "https://www.youtube.com/playlist?list=PLPwB6km-TpoAQiDKQnXQW-JUUXBwvkFQY",
      backgroundImage: taebrinBg,
    },
  ];

  return (
    <section
      id="lore"
      className="py-20 lg:py-32 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold mb-4"
            data-testid="text-world-title"
          >
            Our Campaign Worlds
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore the diverse realms and campaigns that make up the Tales of
            Aneria universe
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaignWorlds.map((world) => (
            <Card
              key={world.id}
              className="hover-elevate cursor-pointer transition-all relative overflow-hidden"
              data-testid={`card-world-${world.id}`}
              onClick={() =>
                !world.comingSoon &&
                window.open(world.link, "_blank", "noopener,noreferrer")
              }
            >
              {world.backgroundImage && (
                <LazyBackgroundImage
                  src={world.backgroundImage}
                  alt={`${world.name} background`}
                  className="w-full h-full object-cover opacity-10"
                />
              )}
              {world.comingSoon && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    variant="secondary"
                    data-testid={`badge-coming-soon-${world.id}`}
                  >
                    Coming Soon
                  </Badge>
                </div>
              )}
              <CardHeader className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  {world.icon}
                </div>
                <CardTitle
                  className="font-serif text-2xl"
                  data-testid={`text-world-${world.id}-title`}
                >
                  {world.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <p
                  className="text-muted-foreground text-sm"
                  data-testid={`text-world-${world.id}-description`}
                >
                  {world.description}
                </p>

                {world.campaigns.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                      Campaigns
                    </h4>
                    {world.campaigns.map((campaign, idx) => (
                      <div
                        key={idx}
                        className="space-y-1"
                        data-testid={`campaign-${world.id}-${idx}`}
                      >
                        <div className="font-semibold text-sm text-foreground">
                          {campaign.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {campaign.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!world.comingSoon && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid={`button-explore-${world.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(world.link, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {world.link === worldAnvilUrl ? 'Explore on WorldAnvil' : 'Explore on YouTube'}
                    </Button>
                  </div>
                )}

                <CharacterCarousel worldId={world.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
