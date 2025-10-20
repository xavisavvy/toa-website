import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  image: string;
}

export default function PromotionsSection() {
  //todo: remove mock functionality - Replace with actual promotions data
  const promotions: Promotion[] = [
    {
      id: "1",
      title: "Journeys Through Taebrin Premiere Event",
      description:
        "Join us for a special live premiere event with exclusive behind-the-scenes content and Q&A",
      badge: "Coming Soon",
      image: "@a",
    },
    // {
    //   id: "2",
    //   title: "Limited Edition Dice Set",
    //   description: "Coming Soon!",
    //   badge: "Coming Soon",
    //   image: "",
    // },
  ];

  return (
    <section className="py-20 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold mb-4"
            data-testid="text-promotions-title"
          >
            Special Offers
          </h2>
          <p className="text-muted-foreground text-lg">
            Don't miss out on exclusive events and limited-time deals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {promotions.map((promo) => (
            <Card
              key={promo.id}
              className="overflow-hidden hover-elevate cursor-pointer transition-all"
              data-testid={`card-promotion-${promo.id}`}
              onClick={() => console.log(`Promotion ${promo.id} clicked`)}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <Badge
                  className="absolute top-4 right-4 bg-primary"
                  data-testid={`badge-promotion-${promo.id}`}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {promo.badge}
                </Badge>
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
                <Button data-testid={`button-learn-more-${promo.id}`}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
