export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  inStock: boolean;
  addedAt: number;
  availableQuantity?: number; // Maximum quantity available to order
}

export interface Cart {
  items: CartItem[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface CartSummary {
  itemCount: number;
  totalItems: number;
  subtotal: number;
}

export interface ShippingEstimate {
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
