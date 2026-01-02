import {
  ArrowLeft,
  ExternalLink,
  User,
  Sword,
  Shield,
  Heart,
  Music,
} from "lucide-react";
import { useRoute, Link } from "wouter";

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
import { getCreativeWorkSchema, getBreadcrumbSchema } from "@/lib/structuredData";

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
  dndbeyond: string;
  playlist?: string;
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
        <div className="flex items-center justify-center py-20 pt-24">
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

  const characterSchema = getCreativeWorkSchema({
    name: character.name,
    description: character.backstory,
    creator: character.player,
    image: character.featuredImage
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Characters", url: "https://talesofaneria.com/characters" },
    { name: character.name, url: `https://talesofaneria.com/characters/${character.id}` }
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [characterSchema, breadcrumbData]
  };

  const metaDescription = `Meet ${character.name}, a ${character.race} ${character.class} from ${character.campaign}. ${character.backstory.substring(0, 120)}...`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${character.name} - ${character.race} ${character.class} | Tales of Aneria`}
        description={metaDescription}
        canonical={`https://talesofaneria.com/characters/${character.id}`}
        ogImage={character.featuredImage}
        ogImageAlt={`${character.name} - ${character.race} ${character.class} character portrait`}
        ogType="profile"
        keywords={`${character.name}, ${character.race}, ${character.class}, ${character.campaign}, D&D character, TTRPG hero, ${character.player}`}
        jsonLd={structuredData}
        twitterCard="summary_large_image"
      />
      <Navigation />
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-b from-primary/20 to-background overflow-hidden pt-24">
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
              {featuredImage?.isAiGenerated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="secondary" 
                        className="bg-amber-500 text-white border-amber-600 cursor-help"
                        data-testid="badge-ai-featured"
                      >
                        AI Art
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>This artwork was generated using AI for early character exploration and personal use. AI-generated artwork is not used for commercial purposes or merchandise. We believe in transparency about the use of AI tools in creative work.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-20">
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
                        className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden"
                        data-testid={`gallery-image-${image.id}`}
                      >
                        {image.url ? (
                          <>
                            <img
                              src={image.url}
                              alt={image.caption}
                              className="object-cover w-full h-full"
                              itemProp="image"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
                              <p className="text-white text-sm font-medium mb-1">
                                {image.caption}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {image.type && (
                                  <Badge 
                                    variant={image.type === 'official' ? 'default' : 'secondary'} 
                                    className="text-xs"
                                    data-testid={`badge-type-${image.id}`}
                                  >
                                    {image.type === 'official' ? 'Official Art' : 'Fan Art'}
                                  </Badge>
                                )}
                                {image.isAiGenerated && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="text-amber-300 text-xs flex items-center gap-1 cursor-help">
                                          <span className="inline-block w-1.5 h-1.5 bg-amber-300 rounded-full"></span>
                                          AI Art
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>This artwork was generated using AI for early character exploration and personal use. AI-generated artwork is not used for commercial purposes or merchandise. We believe in transparency about the use of AI tools in creative work.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              {image.copyright && (
                                <p 
                                  className="text-white/70 text-xs" 
                                  itemProp="copyrightHolder"
                                  data-testid={`copyright-${image.id}`}
                                >
                                  © {image.copyright}
                                </p>
                              )}
                              {image.artist && (
                                <p className="text-white/70 text-xs mt-1">
                                  {image.artistUrl ? (
                                    <>
                                      Art by{' '}
                                      <a
                                        href={image.artistUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-foreground hover:text-white underline"
                                        itemProp="creator"
                                        data-testid={`artist-link-${image.id}`}
                                      >
                                        {image.artist}
                                      </a>
                                    </>
                                  ) : (
                                    <span itemProp="creator">Art by {image.artist}</span>
                                  )}
                                </p>
                              )}
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
                    asChild
                    data-testid="button-dndbeyond"
                  >
                    <a
                      href={character.dndbeyond}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on D&D Beyond
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Character Playlist */}
            {character.playlist && (
              <Card data-testid="card-playlist">
                <CardContent className="pt-6">
                  <Button
                    className="w-full"
                    variant="outline"
                    asChild
                    data-testid="button-playlist"
                  >
                    <a
                      href={character.playlist}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Character Playlist
                    </a>
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
