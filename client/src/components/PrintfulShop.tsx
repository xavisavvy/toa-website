import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, AlertCircle, CreditCard } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCheckout } from "@/lib/stripe";


interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  inStock: boolean;
  variants?: Array<{
    id: string;
    name: string;
    price: string;
    inStock: boolean;
  }>;
}

interface PrintfulShopProps {
  enableCheckout?: boolean;
  limit?: number;
}

export default function PrintfulShop({ enableCheckout = false, limit }: PrintfulShopProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/printful/products', limit],
    queryFn: async () => {
      const url = limit ? `/api/printful/products?limit=${limit}` : '/api/printful/products';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayProducts = products || [];

  const handleProductClick = async (product: Product) => {
    if (!enableCheckout) {
      // Redirect to shop page with checkout enabled
      window.location.href = '/shop';
      return;
    }

    // Get first available variant or use product directly
    const variant = product.variants?.[0];
    if (!variant) {
      console.error('No variants available for product');
      return;
    }

    setCheckoutLoading(product.id);

    try {
      // Extract numeric price from string like "$24.99" or "$24.99 - $29.99"
      const priceMatch = variant.price.match(/\$?([\d.]+)/);
      const price = priceMatch ? priceMatch[1] : '0';

      const result = await createCheckout({
        productId: product.id,
        variantId: variant.id,
        productName: `${product.name} - ${variant.name}`,
        price,
        quantity: 1,
        imageUrl: product.image,
      });

      if (result?.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <section id="printful-shop" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-4" data-testid="text-printful-shop-title">
            Official Merchandise
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            High-quality print-on-demand products featuring Tales of Aneria designs
          </p>
          {enableCheckout && (
            <p className="text-sm text-muted-foreground">
              Secure checkout powered by Stripe
            </p>
          )}
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
                Unable to load products at the moment.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check back later!
              </p>
            </CardContent>
          </Card>
        ) : displayProducts.length === 0 ? (
          <Card className="mb-12">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                We&apos;re setting up our product catalog. Check back soon!
              </p>
              <p className="text-sm text-muted-foreground">
                New products are being added regularly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {displayProducts.map((product) => {
              const isLoading = checkoutLoading === product.id;
              return (
              <Card
                key={product.id}
                className="overflow-hidden hover-elevate cursor-pointer transition-all"
                data-testid={`card-printful-product-${product.id}`}
                onClick={() => handleProductClick(product)}
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
                      data-testid={`badge-printful-product-${product.id}`}
                    >
                      Sold Out
                    </Badge>
                  )}
                  {enableCheckout && product.inStock && !isLoading && (
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="default" className="bg-primary/90">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Buy Now
                      </Badge>
                    </div>
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
            );
            })}
          </div>
        )}

        <div className="text-center space-y-4">
          {enableCheckout ? (
            <Button 
              size="lg"
              className="text-lg px-8"
              data-testid="button-browse-all"
              onClick={() => window.location.href = '/shop'}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse All Products
            </Button>
          ) : (
            <Button 
              size="lg"
              className="text-lg px-8"
              data-testid="button-visit-shop"
              onClick={() => window.location.href = '/shop'}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              View All Products
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
