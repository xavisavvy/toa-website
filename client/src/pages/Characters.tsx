import { Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import charactersData from "@/data/characters.json";
import { getBreadcrumbSchema } from "@/lib/structuredData";

interface CharacterImage {
  id: string;
  url?: string;
  caption: string;
  type: string;
  isFeatured: boolean;
  artist?: string;
  artistUrl?: string;
  copyright?: string;
  isAiGenerated?: boolean;
}

interface Character {
  id: string;
  name: string;
  player: string;
  playerId: string;
  campaign: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  featuredImage?: string;
  images: CharacterImage[];
  backstory: string;
  personality: string;
  dndbeyond?: string;
  dndbeyondId?: string;
  playlist?: string;
  status: string;
}

export default function Characters() {
  const characters: Character[] = charactersData.characters;
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  // Get unique campaigns
  const campaigns = Array.from(
    new Set(characters.map((char) => char.campaign))
  ).sort();

  // Filter characters by selected campaign
  const filteredCharacters = selectedCampaign === "all" 
    ? characters 
    : characters.filter((char) => char.campaign === selectedCampaign);

  const activeCharacters = filteredCharacters.filter((char) => char.status === "active");
  const inactiveCharacters = filteredCharacters.filter(
    (char) => char.status !== "active"
  );

  const CharacterCard = ({ character }: { character: Character }) => {
    const featuredImage = character.images.find((img) => img.isFeatured);
    
    return (
      <Link key={character.id} href={`/characters/${character.id}`} className="relative z-0 hover:z-10">
        <Card
          className="overflow-hidden hover-elevate cursor-pointer transition-all h-full"
          data-testid={`card-character-${character.id}`}
        >
          <div className="relative aspect-[3/4] bg-muted overflow-hidden">
            {character.featuredImage ? (
              <img
                src={character.featuredImage}
                alt={character.name}
                className="object-cover w-full h-full"
                width="300"
                height="400"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Users className="h-16 w-16" />
              </div>
            )}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <Badge variant="secondary" data-testid={`badge-level-${character.id}`}>
                Level {character.level}
              </Badge>
              {featuredImage?.isAiGenerated && (
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div 
                        onClick={(e) => e.preventDefault()}
                        onMouseDown={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="bg-amber-500/90 text-white border-amber-600 cursor-help"
                          data-testid={`badge-ai-${character.id}`}
                        >
                          AI Art
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>This artwork was generated using AI for early character exploration and personal use. AI-generated artwork is not used for commercial purposes or merchandise. We believe in transparency about the use of AI tools in creative work.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        <CardHeader>
          <CardTitle
            className="text-xl mb-2"
            data-testid={`text-character-name-${character.id}`}
          >
            {character.name}
          </CardTitle>
          <p
            className="text-sm text-muted-foreground"
            data-testid={`text-character-class-${character.id}`}
          >
            {character.race} {character.class}
          </p>
        </CardHeader>
        <CardContent>
          <p
            className="text-xs text-muted-foreground mb-2"
            data-testid={`text-character-player-${character.id}`}
          >
            Played by {character.player}
          </p>
          <p
            className="text-sm line-clamp-3 mb-3"
            data-testid={`text-character-backstory-${character.id}`}
          >
            {character.backstory}
          </p>
          <Badge 
            variant="outline" 
            className="text-xs"
            data-testid={`badge-campaign-${character.id}`}
          >
            {character.campaign}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
};

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Characters", url: "https://talesofaneria.com/characters" }
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Meet the Characters - Tales of Aneria TTRPG"
        description="Explore our diverse cast of heroes, NPCs, villains, and homebrew creatures from Tales of Aneria. Discover active adventurers and legendary figures across Aneria, Pterrordale, and Taebrin."
        canonical="https://talesofaneria.com/characters"
        keywords="D&D characters, TTRPG heroes, NPCs, villains, homebrew creatures, Dungeons and Dragons adventurers, fantasy characters, Aneria characters"
        jsonLd={breadcrumbData}
      />
      <Navigation />
      <div className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Users className="h-8 w-8" />
          </div>
          <h1
            className="font-serif text-4xl md:text-5xl font-semibold mb-6"
            data-testid="text-page-title"
          >
            Meet the Characters
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
            data-testid="text-page-description"
          >
            Discover our diverse cast of heroes, NPCs, villains, and homebrew creatures 
            who shape the stories across our campaigns. From active adventurers to legendary 
            figures of the past, explore the characters that bring our worlds to life.
          </p>
        </div>

        {/* Campaign Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCampaign === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCampaign("all")}
              data-testid="filter-all"
            >
              All Campaigns
            </Button>
            {campaigns.map((campaign) => (
              <Button
                key={campaign}
                variant={selectedCampaign === campaign ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCampaign(campaign)}
                data-testid={`filter-${campaign.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {campaign}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Characters */}
        {activeCharacters.length > 0 && (
          <div className="mb-16">
            <h2
              className="font-serif text-3xl font-semibold mb-8"
              data-testid="text-active-title"
            >
              Active Characters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeCharacters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Characters */}
        {inactiveCharacters.length > 0 && (
          <div>
            <h2
              className="font-serif text-3xl font-semibold mb-8 text-muted-foreground"
              data-testid="text-inactive-title"
            >
              Past Characters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {inactiveCharacters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
