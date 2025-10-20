import { Button } from "@/components/ui/button";
import { Play, BookOpen } from "lucide-react";
import heroImage from "@assets/generated_images/Fantasy_TTRPG_hero_background_186c3d57.png";
import socialLinksData from "@/data/social-links.json";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center py-20">
        <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground" data-testid="text-hero-title">
          Tales of Aneria
        </h1>
        <p className="text-xl md:text-2xl lg:text-3xl mb-8 text-muted-foreground font-light" data-testid="text-hero-tagline">
          An epic journey through a world of magic, mystery, and adventure
        </p>
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto text-muted-foreground" data-testid="text-hero-description">
          Join our heroes as they unravel ancient secrets and forge their destiny in the mystical realm of Aneria
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button 
            size="lg" 
            className="text-lg px-8 min-h-12"
            data-testid="button-watch-latest"
            onClick={() => window.open(socialLinksData.youtube, '_blank', 'noopener,noreferrer')}
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Latest Episode
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 min-h-12 backdrop-blur-sm bg-background/20"
            data-testid="button-explore-world"
            onClick={() => scrollToSection('#lore')}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Explore the World
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full p-1">
          <div className="w-1.5 h-3 bg-foreground/30 rounded-full mx-auto" />
        </div>
      </div>
    </section>
  );
}
