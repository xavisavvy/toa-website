import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, AlertCircle, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { parsePrice } from "@/components/PriceDisplay";
import { ProductCard } from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high">("name");
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

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

  // Auto-open modal if product ID is in URL
  useEffect(() => {
    if (!products || typeof window === 'undefined') {return;}
    
    const urlParams = new window.URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setIsModalOpen(true);
        // Clean up URL without reload
        window.history.replaceState({}, '', '/shop');
      }
    }
  }, [products]);

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

      const priceA = parsePrice(a.price);
      const priceB = parsePrice(b.price);

      if (sortBy === "price-low") {
        return priceA - priceB;
      } else if (sortBy === "price-high") {
        return priceB - priceA;
      }

      return 0;
    });
  }, [products, searchQuery, filterType, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, sortBy]);

  // Scroll to top when page changes
  useEffect(() => {
    if (!limit && currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, limit]);

  // Pagination calculations
  const totalPages = Math.ceil(displayProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = limit ? displayProducts : displayProducts.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      endPage = 4;
    }
    if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }

    if (startPage > 2) {
      pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const handleProductClick = (product: Product) => {
    // Track product view
    const priceValue = parsePrice(product.price);
    analytics.viewItem(product.name, product.id, priceValue);

    if (!enableCheckout) {
      // Redirect to shop page with checkout enabled
      window.location.href = '/shop';
      return;
    }

    // Open product detail modal
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />

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
            <Select value={sortBy} onValueChange={(value: "name" | "price-low" | "price-high") => setSortBy(value)}>
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

          {/* Results count and items per page */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {displayProducts.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, displayProducts.length)} of {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'}
            </p>
            
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
                <SelectItem value="48">48 per page</SelectItem>
                <SelectItem value="96">96 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton count={4} type="product" />
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                inStock={product.inStock}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>

          {/* Pagination Controls - Only show if not limiting products and there are multiple pages */}
          {!limit && totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Page info */}
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>

              {/* Pagination buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum as number)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}
