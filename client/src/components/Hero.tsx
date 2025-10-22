import { Button } from "@/components/ui/button";
import { Play, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import butterflyImage from "@assets/hero-butterfly.png";
import cinderhearthImage from "@assets/hero-cinderhearth.png";
import desertImage from "@assets/hero-desert.png";
import spaceImage from "@assets/hero-space.png";
import socialLinksData from "@/data/social-links.json";

const heroImages = [
  butterflyImage,
  cinderhearthImage,
  desertImage,
  spaceImage,
];

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    // Ensure we start at index 0
    setCurrentImageIndex(0);
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Preload current and next image
  useEffect(() => {
    const nextIndex = (currentImageIndex + 1) % heroImages.length;
    const imagesToLoad = [currentImageIndex, nextIndex];
    
    imagesToLoad.forEach((index) => {
      if (!loadedImages.has(index)) {
        const img = new Image();
        img.src = heroImages[index];
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, index]));
        };
      }
    });
  }, [currentImageIndex, loadedImages]);

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {heroImages.map((image, index) => {
        // Only render images that have been loaded or are currently visible
        const shouldRender = loadedImages.has(index) || index === currentImageIndex;
        if (!shouldRender) return null;

        return (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center py-20">
        <h1 
          className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground" 
          data-testid="text-hero-title"
          style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.5)' }}
        >
          Tales of Aneria
        </h1>
        <p 
          className="text-xl md:text-2xl lg:text-3xl mb-8 text-muted-foreground font-light" 
          data-testid="text-hero-tagline"
          style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 3px 12px rgba(0, 0, 0, 0.5)' }}
        >
          An epic journey through a world of magic, mystery, and adventure
        </p>
        <p 
          className="text-lg md:text-xl mb-12 max-w-2xl mx-auto text-muted-foreground" 
          data-testid="text-hero-description"
          style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 3px 12px rgba(0, 0, 0, 0.5)' }}
        >
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

      <div className="absolute bottom-8 right-8 flex gap-2 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentImageIndex 
                ? 'bg-primary w-8' 
                : 'bg-foreground/30 hover:bg-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            data-testid={`button-carousel-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
