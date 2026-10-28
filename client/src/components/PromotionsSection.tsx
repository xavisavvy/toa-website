import { ExternalLink, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Promotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  image: string;
  link: string;
  ctaLabel: string;
}

export default function PromotionsSection() {
  const promotions: Promotion[] = [
    {
      id: "pterrordale-2026",
      title: "Pterrordale: Don't Look at the Screen!",
      description:
        "Our Halloween one-shot returns to the unfortunate town of Pterrordale. Six new heroes, one very bad broadcast. Premieres Wednesday, October 28 at 10 AM MT, so subscribe and don't miss it.",
      badge: "Halloween One Shot",
      image: "/promotions/pterrordale-2026.webp",
      link: "https://www.youtube.com/watch?v=3IURs0HrT8s",
      ctaLabel: "Watch the Premiere",
    },
  ];

  if (promotions.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold mb-4"
            data-testid="text-promotions-title"
          >
            Events &amp; Specials
          </h2>
          <p className="text-muted-foreground text-lg">
            Don&apos;t miss out on exclusive events and limited-time deals
          </p>
        </div>

        <div
          className={
            promotions.length === 1
              ? "max-w-3xl mx-auto"
              : "grid grid-cols-1 md:grid-cols-2 gap-8"
          }
        >
          {promotions.map((promo) => (
            <Card
              key={promo.id}
              className="overflow-hidden hover-elevate transition-all"
              data-testid={`card-promotion-${promo.id}`}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="object-cover w-full h-full"
                  width="640"
                  height="360"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                {/* Badge's hover-elevate forces position:relative, so position the wrapper */}
                <div className="absolute top-4 left-4">
                  <Badge
                    className="bg-primary"
                    data-testid={`badge-promotion-${promo.id}`}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {promo.badge}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3
                  className="font-serif text-2xl font-semibold mb-3"
                  data-testid={`text-promotion-title-${promo.id}`}
                >
                  {promo.title}
                </h3>
                <p
                  className="text-muted-foreground mb-4"
                  data-testid={`text-promotion-description-${promo.id}`}
                >
                  {promo.description}
                </p>
                <Button asChild data-testid={`button-learn-more-${promo.id}`}>
                  <a href={promo.link} target="_blank" rel="noopener noreferrer">
                    {promo.ctaLabel}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
