import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getDaysUntilExpiration } from '@/lib/cart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateShipping, FREE_SHIPPING_THRESHOLD, calculateOrderTotal } from '@/lib/shipping';

export function CartButton() {
  const [, setLocation] = useLocation();
  const { cart, removeItem, updateQuantity, getCartSummary } = useCart();
  const summary = getCartSummary();
  const daysUntilExpiration = getDaysUntilExpiration(cart);

  // Check for quantity issues
  const quantityIssues = cart.items.filter(
    (item) => item.availableQuantity !== undefined && item.quantity > item.availableQuantity
  );

  // Calculate shipping
  const shipping = calculateShipping(summary.subtotal);
  const estimatedTotal = calculateOrderTotal(summary.subtotal, shipping);
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - summary.subtotal);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            aria-label={`Shopping cart with ${summary.totalItems} items`}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
          {summary.totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 min-w-[1.25rem] rounded-full p-0 flex items-center justify-center text-xs pointer-events-none"
            >
              {summary.totalItems}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
          <SheetDescription>
            {summary.itemCount === 0
              ? 'Your cart is empty'
              : `${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'} in cart`}
          </SheetDescription>
        </SheetHeader>

        {summary.itemCount > 0 && daysUntilExpiration <= 3 && (
          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              Your cart will expire in {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'}
            </AlertDescription>
          </Alert>
        )}

        {quantityIssues.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="text-sm">
              {quantityIssues.length} {quantityIssues.length === 1 ? 'item has' : 'items have'} quantity issues. 
              Please adjust before checkout.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto my-6 space-y-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">Your cart is empty</p>
              <SheetTrigger asChild>
                <Button onClick={() => setLocation('/shop')}>Browse Shop</Button>
              </SheetTrigger>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border rounded-lg relative"
                data-testid={`cart-item-${item.id}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.variantName}
                  </p>
                  {!item.inStock && (
                    <Badge variant="destructive" className="text-xs mb-2">
                      Out of Stock
                    </Badge>
                  )}
                  {item.availableQuantity !== undefined && item.quantity > item.availableQuantity && (
                    <Badge variant="destructive" className="text-xs mb-2">
                      Exceeds Stock ({item.availableQuantity} available)
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const maxQty = item.availableQuantity !== undefined 
                            ? Math.min(10, item.availableQuantity)
                            : 10;
                          updateQuantity(item.id, Math.min(maxQty, item.quantity + 1));
                        }}
                        disabled={
                          item.quantity >= 10 || 
                          (item.availableQuantity !== undefined && item.quantity >= item.availableQuantity)
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 absolute top-2 right-2"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {summary.itemCount > 0 && (
          <div className="border-t pt-4 space-y-4">
            {/* Pricing Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              {amountUntilFreeShipping > 0 && shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add ${amountUntilFreeShipping.toFixed(2)} more for free shipping!
                </p>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Estimated Total</span>
                <span>${estimatedTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tax calculated at checkout
              </p>
            </div>

            <Separator />

            <SheetTrigger asChild>
              <Link href="/checkout">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            </SheetTrigger>

            <SheetTrigger asChild>
              <Link href="/shop">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
