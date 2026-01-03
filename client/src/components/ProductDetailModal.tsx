import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Package, CreditCard, ShoppingCart, Check } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { analytics } from "@/lib/analytics";
import { createCheckout } from "@/lib/stripe";
import { useCart } from "@/hooks/useCart";
import { loadZipCode, saveZipCode } from "@/lib/zipCode";

interface ProductVariant {
  id: string;
  name: string;
  price: string;
  inStock: boolean;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  inStock: boolean;
  variants?: ProductVariant[];
}

interface ShippingEstimate {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  rates: Array<{
    id: string;
    name: string;
    rate: string;
    minDays: number;
    maxDays: number;
  }>;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [zipCode, setZipCode] = useState(() => loadZipCode());
  const [quantity, setQuantity] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants?.[0] || null);
      setQuantity(1);
      setAddedToCart(false);
      // Keep zip code from previous entry
    }
  }, [product]);

  // Save zip code when it changes
  useEffect(() => {
    if (zipCode && zipCode.length >= 5) {
      saveZipCode(zipCode);
    }
  }, [zipCode]);

  // Fetch shipping estimate when zip code and variant are available
  const { data: shippingEstimate, isLoading: shippingLoading } = useQuery<ShippingEstimate>({
    queryKey: ['shipping-estimate', selectedVariant?.id, zipCode, quantity],
    queryFn: async () => {
      if (!selectedVariant || !zipCode || zipCode.length < 5) {
        throw new Error('Missing required data');
      }

      // Extract base price from variant
      const priceMatch = selectedVariant.price.match(/\$?([\d.]+)/);
      const basePrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

      const response = await fetch('/api/printful/shipping/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          zipCode,
          quantity,
          basePrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to estimate shipping');
      }

      return response.json();
    },
    enabled: !!selectedVariant && zipCode.length >= 5,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {return;}

    const priceMatch = selectedVariant.price.match(/\$?([\d.]+)/);
    const basePrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price: basePrice,
      quantity,
      imageUrl: product.image,
      inStock: selectedVariant.inStock,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleCheckout = async () => {
    if (!product || !selectedVariant) {return;}

    setCheckoutLoading(true);

    try {
      const priceMatch = selectedVariant.price.match(/\$?([\d.]+)/);
      const basePrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

      // Use shipping estimate if available, otherwise just use base price
      const totalPrice = shippingEstimate?.total || basePrice;

      analytics.beginCheckout(totalPrice, [product.name]);

      const result = await createCheckout({
        productId: product.id,
        variantId: selectedVariant.id,
        productName: `${product.name} - ${selectedVariant.name}`,
        price: basePrice.toFixed(2),
        quantity,
        imageUrl: product.image,
        zipCode: zipCode || undefined,
        shipping: shippingEstimate?.shipping,
        tax: shippingEstimate?.tax,
      });

      if (result?.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!product) {return null;}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{product.name}</DialogTitle>
          <DialogDescription>
            Customize your product and estimate shipping costs
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Product Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Options */}
          <div className="space-y-6">
            {/* Variant Selection */}
            {product.variants && product.variants.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="variant-select">Select Option</Label>
                <Select
                  value={selectedVariant?.id}
                  onValueChange={(value) => {
                    const variant = product.variants?.find((v) => v.id === value);
                    if (variant) {
                      setSelectedVariant(variant);
                    }
                  }}
                >
                  <SelectTrigger id="variant-select">
                    <SelectValue placeholder="Choose size, color, etc." />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id} disabled={!variant.inStock}>
                        {variant.name} - {variant.price}
                        {!variant.inStock && " (Out of Stock)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity-input">Quantity</Label>
              <Input
                id="quantity-input"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            {/* Shipping Estimate */}
            <div className="space-y-2">
              <Label htmlFor="zip-input" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Zip/Postal Code (Optional)
              </Label>
              <Input
                id="zip-input"
                type="text"
                placeholder="Enter zip code for shipping estimate"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Enter your zip code to see accurate shipping and tax estimates
              </p>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item Price</span>
                <span className="font-medium">
                  {selectedVariant?.price || product.price}
                </span>
              </div>

              {quantity > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">× {quantity}</span>
                </div>
              )}

              {shippingLoading && zipCode.length >= 5 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating shipping...
                </div>
              )}

              {shippingEstimate && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Shipping
                    </span>
                    <span className="font-medium">
                      ${shippingEstimate.shipping.toFixed(2)}
                    </span>
                  </div>

                  {shippingEstimate.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">
                        ${shippingEstimate.tax.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-primary">
                      ${shippingEstimate.total.toFixed(2)}
                    </span>
                  </div>

                  {shippingEstimate.rates.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Estimated delivery: {shippingEstimate.rates[0].minDays}-
                      {shippingEstimate.rates[0].maxDays} business days
                    </p>
                  )}
                </>
              )}

              {!shippingEstimate && !shippingLoading && zipCode.length < 5 && (
                <p className="text-sm text-muted-foreground">
                  Enter a zip code above to see shipping and tax costs
                </p>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={handleAddToCart}
                disabled={!selectedVariant || !selectedVariant.inStock || addedToCart}
              >
                {addedToCart ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={!selectedVariant || !selectedVariant.inStock || checkoutLoading}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Buy Now
                  </>
                )}
              </Button>
            </div>

            {!selectedVariant?.inStock && (
              <p className="text-sm text-destructive text-center">
                This variant is currently out of stock
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
