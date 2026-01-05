import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, AlertCircle, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  inStock: boolean;
}

export default function PrintfulShopPreview() {
  const [, setLocation] = useLocation();
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/printful/products', 4],
    queryFn: async () => {
      const response = await fetch('/api/printful/products?limit=4');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleProductClick = (productId: string) => {
    setLocation(`/shop?product=${productId}`);
  };

  return (
    <div>
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
            <p className="text-muted-foreground">
              Check out our Etsy store to see all our amazing products!
            </p>
          </CardContent>
        </Card>
      ) : products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover-elevate cursor-pointer transition-all"
                data-testid={`card-printful-product-${product.id}`}
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                    width="400"
                    height="400"
                    loading="lazy"
                  />
                  {!product.inStock && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-3 right-3" 
                      data-testid={`badge-printful-product-${product.id}`}
                    >
                      Sold Out
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 
                    className="font-semibold mb-2 line-clamp-2" 
                    data-testid={`text-printful-product-name-${product.id}`}
                  >
                    {product.name}
                  </h3>
                  <p className="text-primary font-semibold" data-testid={`text-printful-product-price-${product.id}`}>
                    {product.price}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setLocation('/shop')}
              data-testid="button-view-all-products"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse All Products
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <Card className="mb-12">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              We&apos;re setting up our product catalog. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
