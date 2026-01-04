import { ShoppingCart, X } from 'lucide-react';
import { memo, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';

import { CartItem as CartItemComponent } from '@/components/CartItem';
import { QuantityControl } from '@/components/QuantityControl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { getDaysUntilExpiration } from '@/lib/cart';

export function CartButton() {
  const [, setLocation] = useLocation();
  const { cart, removeItem, updateQuantity, cartSummary } = useCart();
  const daysUntilExpiration = getDaysUntilExpiration(cart);

  // Memoize quantity issues calculation
  const quantityIssues = useMemo(() => 
    cart.items.filter(
      (item) => item.availableQuantity !== undefined && item.quantity > item.availableQuantity
    ), [cart.items]
  );

  // Memoize callbacks to prevent re-renders of child components
  const handleRemoveItem = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  }, [updateQuantity]);

  return (
    <Sheet>
      <div className="relative inline-block">
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Shopping cart with ${cartSummary.totalItems} items`}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        {cartSummary.totalItems > 0 && (
          <Badge
            variant="destructive"
            className="!absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-xs pointer-events-none"
          >
            {cartSummary.totalItems > 9999 ? '9999+' : cartSummary.totalItems}
          </Badge>
        )}
      </div>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
          <SheetDescription>
            {cartSummary.itemCount === 0
              ? 'Your cart is empty'
              : `${cartSummary.itemCount} ${cartSummary.itemCount === 1 ? 'item' : 'items'} in cart`}
          </SheetDescription>
        </SheetHeader>

        {cartSummary.itemCount > 0 && daysUntilExpiration <= 3 && (
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
              <CartItemComponent
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onQuantityChange={handleQuantityChange}
              />
            ))
          )}
        </div>

        {cartSummary.itemCount > 0 && (
          <div className="border-t pt-4 space-y-4">
            {/* Pricing Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${cartSummary.subtotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>${cartSummary.subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and tax calculated at checkout
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
