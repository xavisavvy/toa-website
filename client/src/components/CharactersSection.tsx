import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import charactersData from "@/data/characters.json";

interface CharacterImage {
  id: string;
  url: string;
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
  featuredImage: string;
  images: CharacterImage[];
  backstory: string;
  personality: string;
  dndbeyond: string;
  playlist?: string;
  status: string;
}

export default function CharactersSection() {
  const characters: Character[] = charactersData.characters;
  const activeCharacters = characters.filter((char) => char.status === "active");

  return (
    <section id="characters" className="py-20 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Users className="h-8 w-8" />
          </div>
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold mb-6"
            data-testid="text-characters-title"
          >
            Meet the Characters
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
            data-testid="text-characters-description"
          >
            Explore our diverse cast of heroes, NPCs, villains, and homebrew creatures. 
            Each character brings unique abilities, personalities, and stories that shape 
            the epic tales unfolding across our campaigns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {activeCharacters.map((character) => (
            <Link key={character.id} href={`/characters/${character.id}`}>
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
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Users className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" data-testid={`badge-level-${character.id}`}>
                      Level {character.level}
                    </Badge>
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
          ))}
        </div>

        <div className="text-center">
          <Link href="/characters">
            <Button size="lg" data-testid="button-view-all-characters">
              View All Characters & NPCs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
