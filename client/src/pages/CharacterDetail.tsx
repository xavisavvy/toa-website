import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ExternalLink,
  User,
  Sword,
  Shield,
  Heart,
} from "lucide-react";
import charactersData from "@/data/characters.json";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface CharacterImage {
  id: string;
  url: string;
  caption: string;
  type: string;
  isFeatured: boolean;
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
  status: string;
}

export default function CharacterDetail() {
  const [, params] = useRoute("/characters/:id");
  const characterId = params?.id;

  const character = charactersData.characters.find(
    (c: Character) => c.id === characterId
  ) as Character | undefined;

  if (!character) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold mb-4">
              Character Not Found
            </h1>
            <Link href="/characters">
              <Button data-testid="button-back-to-characters">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Characters
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const featuredImage = character.images.find((img) => img.isFeatured);
  const galleryImages = character.images.filter((img) => !img.isFeatured);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        {character.featuredImage && (
          <img
            src={character.featuredImage}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-end pb-12">
          <div>
            <Link href="/characters">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Characters
              </Button>
            </Link>
            <h1
              className="font-serif text-5xl md:text-6xl font-bold mb-4"
              data-testid="text-character-name"
            >
              {character.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default" data-testid="badge-level">
                Level {character.level}
              </Badge>
              <Badge variant="secondary" data-testid="badge-race-class">
                {character.race} {character.class}
              </Badge>
              <Badge variant="outline" data-testid="badge-alignment">
                {character.alignment}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Backstory */}
            <Card data-testid="card-backstory">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Backstory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {character.backstory}
                </p>
              </CardContent>
            </Card>

            {/* Personality */}
            <Card data-testid="card-personality">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Personality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {character.personality}
                </p>
              </CardContent>
            </Card>

            {/* Image Gallery */}
            {character.images.length > 0 && (
              <Card data-testid="card-gallery">
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {character.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square bg-muted rounded-md overflow-hidden"
                        data-testid={`gallery-image-${image.id}`}
                      >
                        {image.url ? (
                          <>
                            <img
                              src={image.url}
                              alt={image.caption}
                              className="object-cover w-full h-full hover:scale-105 transition-transform"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <p className="text-white text-sm">
                                {image.caption}
                              </p>
                              <p className="text-white/60 text-xs capitalize">
                                {image.type}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <Sword className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">{image.caption}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Character Info */}
            <Card data-testid="card-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Character Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Player</p>
                  <Link href={`/#about`}>
                    <p className="font-medium hover:text-primary transition-colors cursor-pointer">
                      {character.player}
                    </p>
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campaign</p>
                  <p className="font-medium">{character.campaign}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Race</p>
                  <p className="font-medium">{character.race}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{character.class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-medium">{character.level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alignment</p>
                  <p className="font-medium">{character.alignment}</p>
                </div>
              </CardContent>
            </Card>

            {/* D&D Beyond Link */}
            {character.dndbeyond && (
              <Card data-testid="card-dndbeyond">
                <CardContent className="pt-6">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        character.dndbeyond,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    data-testid="button-dndbeyond"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on D&D Beyond
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
