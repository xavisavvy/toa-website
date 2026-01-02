import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, AlertCircle, CreditCard, Search, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { analytics } from "@/lib/analytics";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high">("name");
  const [filterType, setFilterType] = useState<string>("all");

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

  // Extract product types from names for filtering
  const productTypes = useMemo(() => {
    if (!products) {return [];}
    const types = new Set<string>();
    products.forEach(product => {
      // Try to extract product type from name (e.g., "T-Shirt", "Hoodie", "Mug")
      const match = product.name.match(/\b(T-Shirt|Hoodie|Sweatshirt|Mug|Hat|Cap|Poster|Sticker|Bag|Tank|Long Sleeve)\b/i);
      if (match) {
        types.add(match[1]);
      }
    });
    return Array.from(types).sort();
  }, [products]);

  // Filter and sort products
  const displayProducts = useMemo(() => {
    if (!products) {return [];}
    
    let filtered = products;

    // Apply search filter - search in product name and variants
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        // Search in main product name
        if (product.name.toLowerCase().includes(query)) {
          return true;
        }
        // Also search in variant names if they exist
        if (product.variants) {
          return product.variants.some(variant => 
            variant.name.toLowerCase().includes(query)
          );
        }
        return false;
      });
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filterType.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      
      // Extract first price from price string
      const getPrice = (priceStr: string) => {
        const match = priceStr.match(/\$?([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
      };

      const priceA = getPrice(a.price);
      const priceB = getPrice(b.price);

      if (sortBy === "price-low") {
        return priceA - priceB;
      } else if (sortBy === "price-high") {
        return priceB - priceA;
      }

      return 0;
    });
  }, [products, searchQuery, filterType, sortBy]);

  const handleProductClick = async (product: Product) => {
    // Track product view
    const priceMatch = product.price.match(/\$?([\d.]+)/);
    const priceValue = priceMatch ? parseFloat(priceMatch[1]) : undefined;
    analytics.viewItem(product.name, product.id, priceValue);

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

      analytics.beginCheckout(parseFloat(price), [product.name]);

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
    <div>
      {/* Filter and Sort Controls - Only show if not limiting products */}
      {!limit && displayProducts.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            {productTypes.length > 0 && (
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {productTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <Card>
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
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== "all"
                ? "No products match your search criteria."
                : "We're setting up our product catalog. Check back soon!"}
            </p>
            {(searchQuery || filterType !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </div>
  );
}
