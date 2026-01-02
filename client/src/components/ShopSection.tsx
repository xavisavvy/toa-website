import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, ExternalLink, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import socialLinksData from "@/data/social-links.json";


interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  inStock: boolean;
}

export default function ShopSection() {
  // Extract shop name from Etsy URL
  const etsyShopName = socialLinksData.etsy.split('/shop/')[1];
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/etsy/shop', etsyShopName, 'listings'],
    queryFn: async () => {
      const response = await fetch(`/api/etsy/shop/${etsyShopName}/listings?limit=8`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const displayProducts = products?.slice(0, 4) || [];

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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="mb-12">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Unable to load products from our Etsy shop.
              </p>
              <p className="text-sm text-muted-foreground">
                Please visit our store directly to see our latest items!
              </p>
            </CardContent>
          </Card>
        ) : displayProducts.length === 0 ? (
          <Card className="mb-12">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Check out our Etsy store to see all our amazing products!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {displayProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover-elevate cursor-pointer transition-all"
                data-testid={`card-product-${product.id}`}
                onClick={() => window.open(product.url, '_blank', 'noopener,noreferrer')}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  {!product.inStock && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-3 right-3" 
                      data-testid={`badge-product-${product.id}`}
                    >
                      Sold Out
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 
                    className="font-semibold mb-2 line-clamp-2" 
                    data-testid={`text-product-name-${product.id}`}
                  >
                    {product.name}
                  </h3>
                  <p className="text-primary font-semibold" data-testid={`text-product-price-${product.id}`}>
                    {product.price}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
