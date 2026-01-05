import { X } from 'lucide-react';
import { memo } from 'react';

import { QuantityControl } from '@/components/QuantityControl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  // eslint-disable-next-line no-unused-vars
  onRemove: (itemId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onQuantityChange: (itemId: string, quantity: number) => void;
}

/**
 * Memoized CartItem component to prevent unnecessary re-renders
 * Only re-renders when item data, onRemove, or onQuantityChange changes
 */
export const CartItem = memo<CartItemProps>(({ item, onRemove, onQuantityChange }) => {
  const hasQuantityIssue = item.availableQuantity !== undefined && item.quantity > item.availableQuantity;

  return (
    <div
      className="flex gap-4 p-4 border rounded-lg relative"
      data-testid={`cart-item-${item.id}`}
    >
      <img
        src={item.imageUrl}
        alt={item.productName}
        className="w-20 h-20 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold truncate">{item.productName}</h3>
            <p className="text-sm text-muted-foreground truncate">{item.variantName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.productName} from cart`}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <QuantityControl
            quantity={item.quantity}
            onIncrease={() => onQuantityChange(item.id, item.quantity + 1)}
            onDecrease={() => onQuantityChange(item.id, item.quantity - 1)}
            max={item.availableQuantity || 10}
            disabled={!item.inStock}
          />
          <span className="font-medium whitespace-nowrap">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>

        {!item.inStock && (
          <Badge variant="destructive" className="mt-2">
            Out of Stock
          </Badge>
        )}

        {hasQuantityIssue && (
          <Badge variant="destructive" className="mt-2">
            Only {item.availableQuantity} available
          </Badge>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific values change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.inStock === nextProps.item.inStock &&
    prevProps.item.availableQuantity === nextProps.item.availableQuantity &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onQuantityChange === nextProps.onQuantityChange
  );
});

CartItem.displayName = 'CartItem';
