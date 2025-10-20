import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ExternalLink } from "lucide-react";
import socialLinksData from "@/data/social-links.json";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  badge?: string;
}

export default function ShopSection() {
  //todo: remove mock functionality - Replace with actual Etsy integration
  const products: Product[] = [
    {
      id: "1",
      name: "Aneria Campaign Guide",
      price: "$29.99",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop",
      badge: "Bestseller",
    },
    {
      id: "2",
      name: "Character Portrait Prints",
      price: "$15.99",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop",
    },
    {
      id: "3",
      name: "Tales of Aneria T-Shirt",
      price: "$24.99",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop",
      badge: "New",
    },
    {
      id: "4",
      name: "Map of Aneria Poster",
      price: "$19.99",
      image: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=500&auto=format&fit=crop",
    },
  ];

  return (
    <section id="shop" className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-4" data-testid="text-shop-title">
            Support the Show
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            Explore our exclusive merchandise and take a piece of Aneria home with you
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover-elevate cursor-pointer transition-all"
              data-testid={`card-product-${product.id}`}
              onClick={() => console.log(`Product ${product.id} clicked`)}
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
                {product.badge && (
                  <Badge className="absolute top-3 right-3" data-testid={`badge-product-${product.id}`}>
                    {product.badge}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2" data-testid={`text-product-name-${product.id}`}>
                  {product.name}
                </h3>
                <p className="text-primary font-semibold" data-testid={`text-product-price-${product.id}`}>
                  {product.price}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            className="text-lg px-8"
            data-testid="button-visit-store"
            onClick={() => window.open(socialLinksData.etsy, '_blank', 'noopener,noreferrer')}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Visit Our Etsy Store
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
