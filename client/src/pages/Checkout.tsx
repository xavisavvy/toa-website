import { useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, MapPin, Package, CreditCard, AlertCircle, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { analytics } from '@/lib/analytics';
import { createCheckout } from '@/lib/stripe';
import { validateCartItems } from '@/lib/cart';
import type { ShippingEstimate } from '@/types/cart';
import { Badge } from '@/components/ui/badge';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, removeItem, updateQuantity, getCartSummary, clearCart } = useCart();
  const summary = getCartSummary();
  
  const [zipCode, setZipCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const validation = validateCartItems(cart);

  const { data: shippingEstimate, isLoading: shippingLoading } = useQuery<ShippingEstimate>({
    queryKey: ['cart-shipping-estimate', cart.items.map(i => i.id).join(','), zipCode],
    queryFn: async () => {
      if (!zipCode || zipCode.length < 5 || cart.items.length === 0) {
        throw new Error('Missing required data');
      }

      const response = await fetch('/api/printful/shipping/estimate-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            basePrice: item.price,
          })),
          zipCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to estimate shipping');
      }

      return response.json();
    },
    enabled: zipCode.length >= 5 && cart.items.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleCheckout = async () => {
    if (cart.items.length === 0 || !validation.valid) {
      return;
    }

    setCheckoutLoading(true);

    try {
      const totalPrice = shippingEstimate?.total || summary.subtotal;

      analytics.beginCheckout(totalPrice, cart.items.map(i => i.productName));

      const result = await createCheckout({
        items: cart.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: `${item.productName} - ${item.variantName}`,
          price: item.price.toFixed(2),
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        zipCode: zipCode || undefined,
        shipping: shippingEstimate?.shipping,
        tax: shippingEstimate?.tax,
      });

      if (result?.url) {
        clearCart();
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

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Checkout - Tales of Aneria"
          description="Complete your Tales of Aneria merchandise purchase"
          canonical="https://talesofaneria.com/checkout"
        />
        <Navigation />
        
        <main className="pt-16">
          <div className="max-w-3xl mx-auto px-6 py-20">
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-serif font-semibold mb-2">Your Cart is Empty</h1>
                <p className="text-muted-foreground mb-6">
                  Add some items to your cart before checking out
                </p>
                <Button onClick={() => setLocation('/shop')}>
                  Browse Shop
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Checkout - Tales of Aneria"
        description="Complete your Tales of Aneria merchandise purchase"
        canonical="https://talesofaneria.com/checkout"
      />
      <Navigation />
      
      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">Checkout</h1>

          {!validation.valid && (
            <Card className="mb-6 border-destructive">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {validation.outOfStockItems.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-destructive mb-2">Items Out of Stock</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          The following items are no longer available. Please remove them to continue.
                        </p>
                        <ul className="space-y-1">
                          {validation.outOfStockItems.map(item => (
                            <li key={item.id} className="text-sm flex items-center justify-between">
                              <span>{item.productName} - {item.variantName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {validation.quantityExceededItems.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-destructive mb-2">Quantity Exceeds Available Stock</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Requested quantities exceed available stock. Adjust or remove these items.
                        </p>
                        <ul className="space-y-2">
                          {validation.quantityExceededItems.map(({ item, requested, available }) => (
                            <li key={item.id} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{item.productName} - {item.variantName}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  Requested: {requested}, Available: {available}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, available)}
                                >
                                  Adjust to {available}
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {cart.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold mb-1">{item.productName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.variantName}
                            </p>
                            {!item.inStock && (
                              <Badge variant="destructive" className="mb-2">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Label className="text-sm">Qty:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                          <span className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Summary */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">Shipping Information</h2>

                  <div className="space-y-2">
                    <Label htmlFor="zip-input" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Zip/Postal Code
                    </Label>
                    <Input
                      id="zip-input"
                      type="text"
                      placeholder="Enter zip code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your zip code for accurate shipping and tax estimates
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({summary.totalItems} items)</span>
                      <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
                    </div>

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

                    {!shippingEstimate && !shippingLoading && (
                      <p className="text-sm text-muted-foreground">
                        {zipCode.length < 5
                          ? 'Enter zip code for shipping estimate'
                          : 'Shipping and tax calculated at checkout'}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={!validation.valid || checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Secure checkout powered by Stripe
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
