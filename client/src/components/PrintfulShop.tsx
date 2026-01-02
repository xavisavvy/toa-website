import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ExternalLink, AlertCircle, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createCheckout } from "@/lib/stripe";
import { useState } from "react";

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
}

export default function PrintfulShop({ enableCheckout = false }: PrintfulShopProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/printful/products'],
    queryFn: async () => {
      const response = await fetch('/api/printful/products?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayProducts = products?.slice(0, 4) || [];

  const handleProductClick = async (product: Product) => {
    if (!enableCheckout) {
      // Link to Etsy
      window.open('https://www.etsy.com/shop/talesofaneria', '_blank', 'noopener,noreferrer');
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
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
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
          {!enableCheckout && (
            <p className="text-sm text-muted-foreground">
              Currently available through our Etsy store
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
                Please check back later or visit our Etsy store!
              </p>
            </CardContent>
          </Card>
        ) : displayProducts.length === 0 ? (
          <Card className="mb-12">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                We're setting up our product catalog. Check back soon!
              </p>
              <p className="text-sm text-muted-foreground">
                In the meantime, you can browse our Etsy store for available items.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {displayProducts.map((product) => (
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
                  {enableCheckout && product.inStock && (
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
            ))}
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
            <>
              <p className="text-sm text-muted-foreground mb-4">
                These products are powered by Printful and currently available through our Etsy store
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg"
                  className="text-lg px-8"
                  data-testid="button-visit-etsy"
                  onClick={() => window.open('https://www.etsy.com/shop/talesofaneria', '_blank', 'noopener,noreferrer')}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Shop on Etsy
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
