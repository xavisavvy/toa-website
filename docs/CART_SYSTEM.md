# Shopping Cart System

A comprehensive shopping cart implementation for Tales of Aneria merchandise with enterprise-grade best practices.

## Features

### Core Functionality
- ✅ **Add to Cart**: Users can add multiple items with different variants and quantities
- ✅ **Update Quantities**: Modify item quantities directly in the cart (1-10 items max)
- ✅ **Remove Items**: Individual item removal with analytics tracking
- ✅ **Persistent Storage**: Cart data saved to localStorage with automatic sync
- ✅ **Cart Expiration**: Automatic expiration after 7 days with user warnings
- ✅ **Stock Validation**: Real-time validation of item availability
- ✅ **Analytics Integration**: Full GA4 event tracking for cart actions

### User Experience
- 🛒 **Cart Badge**: Persistent cart indicator in navigation with item count
- 📱 **Responsive Design**: Mobile-optimized slide-out cart panel
- ⚡ **Quick Actions**: "Add to Cart" or "Buy Now" options on product detail
- 🔔 **Expiration Warnings**: Alerts when cart expires in 3 days or less
- ✨ **Visual Feedback**: Success animations for adding items

### Security & Performance
- 🔒 **Client-Side Only**: Cart state managed locally for privacy
- ⚡ **Optimized Storage**: Efficient localStorage usage with compression
- 🛡️ **Data Validation**: Type-safe cart operations with TypeScript
- 📊 **Analytics Privacy**: No PII tracked, only product interactions

## Architecture

### File Structure
```
client/src/
├── types/
│   └── cart.ts                 # TypeScript interfaces for cart types
├── lib/
│   ├── cart.ts                 # Cart utility functions (storage, calculations)
│   └── analytics.ts            # Enhanced with cart event tracking
├── hooks/
│   └── useCart.ts              # React hook for cart state management
├── components/
│   ├── CartButton.tsx          # Cart UI in navigation
│   └── ProductDetailModal.tsx  # Enhanced with "Add to Cart" button
└── pages/
    └── Checkout.tsx            # Full checkout page with cart review

test/
├── cart.test.ts                # Unit tests for cart utilities (24 tests)
└── use-cart.test.ts            # Unit tests for useCart hook (7 tests)
```

### Data Flow

```
User Action → useCart Hook → Cart Utilities → localStorage
                ↓                    ↓
           Analytics Event    UI Update (React State)
```

## Usage

### Adding to Cart

```typescript
import { useCart } from '@/hooks/useCart';

function ProductCard() {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: `${productId}-${variantId}`,
      productId: 'prod-123',
      variantId: 'var-456',
      productName: 'Tales of Aneria T-Shirt',
      variantName: 'Size L, Black',
      price: 29.99,
      quantity: 1,
      imageUrl: 'https://example.com/image.jpg',
      inStock: true,
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

### Accessing Cart State

```typescript
const { cart, getCartSummary, removeItem, updateQuantity, clearCart } = useCart();

// Get cart summary
const summary = getCartSummary();
console.log(summary.itemCount);    // Number of unique items
console.log(summary.totalItems);   // Total quantity of all items
console.log(summary.subtotal);     // Total price

// Remove item
removeItem('item-id');

// Update quantity
updateQuantity('item-id', 3);

// Clear entire cart
clearCart();
```

## Cart Data Model

### CartItem Interface
```typescript
interface CartItem {
  id: string;              // Unique identifier (productId-variantId)
  productId: string;       // Product ID from Printful
  variantId: string;       // Variant ID (size, color, etc.)
  productName: string;     // Display name
  variantName: string;     // Variant description
  price: number;           // Price in USD
  quantity: number;        // 1-10 items
  imageUrl: string;        // Product image
  inStock: boolean;        // Availability status
  addedAt: number;         // Timestamp when added
}
```

### Cart Interface
```typescript
interface Cart {
  items: CartItem[];       // Array of cart items
  createdAt: number;       // Cart creation timestamp
  updatedAt: number;       // Last modification timestamp
  expiresAt: number;       // Expiration timestamp (7 days)
}
```

## Best Practices Implemented

### 1. Data Persistence
- **localStorage**: Cart persists across browser sessions
- **Automatic Sync**: Changes immediately saved to storage
- **Error Handling**: Graceful fallback if localStorage unavailable
- **JSON Serialization**: Efficient data structure for storage

### 2. Cart Expiration
- **7-Day Expiration**: Industry standard for cart lifetime
- **Proactive Warnings**: Users notified when cart expires in ≤3 days
- **Automatic Cleanup**: Expired carts removed from storage
- **Timestamp Tracking**: Created, updated, and expiration times tracked

### 3. Stock Management
- **Real-Time Validation**: `validateCartItems()` checks stock status
- **Out-of-Stock Alerts**: Clear warnings for unavailable items
- **Checkout Prevention**: Users must remove OOS items to proceed
- **Price Updates**: Latest prices synced when adding existing items

### 4. Analytics Tracking
All cart interactions tracked via Google Analytics 4:
- `add_to_cart`: Item added with product details
- `remove_from_cart`: Item removed with product details
- `begin_checkout`: Checkout initiated with cart value
- `purchase`: Successful purchase (handled by checkout success page)

### 5. User Experience
- **Quantity Limits**: 1-10 items per product (prevents errors)
- **Visual Feedback**: Success states and animations
- **Mobile Optimization**: Touch-friendly controls
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Spinners during API calls

### 6. Security Considerations
- **No Server Storage**: Cart data stays client-side
- **No PII**: Only product IDs and quantities stored
- **XSS Protection**: React auto-escapes user input
- **Type Safety**: Full TypeScript coverage prevents errors

### 7. Performance Optimization
- **Memoization**: `useMemo` prevents unnecessary recalculations
- **Callback Stability**: `useCallback` prevents re-renders
- **Lazy Loading**: Cart UI only rendered when opened
- **Efficient Storage**: Minimal data structure in localStorage

## Error Handling

```typescript
// Storage errors
try {
  localStorage.setItem('toa_shopping_cart', JSON.stringify(cart));
} catch (error) {
  console.error('Error saving cart:', error);
  // Cart continues to work in-memory
}

// Quantity validation
const quantity = Math.max(1, Math.min(10, userInput));

// Stock validation
const { valid, outOfStockItems } = validateCartItems(cart);
if (!valid) {
  // Show warning, prevent checkout
}
```

## Testing

### Unit Tests (31 total)
- ✅ Cart creation and initialization
- ✅ localStorage persistence and loading
- ✅ Expiration detection and cleanup
- ✅ Add, update, remove item operations
- ✅ Total calculations (price, quantity)
- ✅ Stock validation
- ✅ Hook state management
- ✅ Analytics event firing

Run tests:
```bash
npm run test -- cart.test.ts --run
npm run test -- use-cart.test.ts --run
```

## Future Enhancements

### Potential Features
- [ ] **Cart Sync**: Sync cart across devices (requires backend)
- [ ] **Save for Later**: Move items to wishlist
- [ ] **Discount Codes**: Apply promo codes at checkout
- [ ] **Gift Options**: Add gift wrap and messages
- [ ] **Recommendations**: "You may also like" suggestions
- [ ] **Cart Recovery**: Email reminders for abandoned carts
- [ ] **Quantity Warnings**: Alert when requesting high quantities
- [ ] **Price Change Alerts**: Notify when prices change

### Backend Integration (Optional)
```typescript
// Sync cart to server for cross-device support
async function syncCartToServer(cart: Cart) {
  await fetch('/api/cart/sync', {
    method: 'POST',
    body: JSON.stringify({ items: cart.items }),
  });
}
```

## Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader announcements for cart changes
- ✅ Focus management in modal dialogs
- ✅ Color contrast meets WCAG 2.1 AA standards

## Browser Support

- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ Requires localStorage support (99% of browsers)

## Migration Guide

If upgrading from a previous implementation:

1. **Backup existing cart data** (if any)
2. **Import new cart utilities**: `import { useCart } from '@/hooks/useCart'`
3. **Replace direct localStorage calls** with `useCart()` hook
4. **Update product components** to use `addItem()`
5. **Test checkout flow** end-to-end
6. **Verify analytics events** are firing

## License

Part of the Tales of Aneria website project. See main LICENSE file.
