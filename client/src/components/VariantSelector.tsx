import { useState } from 'react';

import { PriceDisplay } from '@/components/PriceDisplay';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Variant {
  id: string;
  name: string;
  price: string;
  inStock: boolean;
  availableQuantity?: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId?: string;
  onVariantChange: (variantId: string) => void;
  label?: string;
  showPrice?: boolean;
  showStock?: boolean;
  className?: string;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  label = 'Select Variant',
  showPrice = true,
  showStock = true,
  className = '',
}: VariantSelectorProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedVariantId || variants[0]?.id || ''
  );

  const selectedId = selectedVariantId ?? internalSelectedId;
  const selectedVariant = variants.find((v) => v.id === selectedId);

  const handleChange = (value: string) => {
    setInternalSelectedId(value);
    onVariantChange(value);
  };

  if (variants.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">No variants available</p>
      </div>
    );
  }

  // If only one variant, show it as text instead of dropdown
  if (variants.length === 1) {
    const variant = variants[0];
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm">{variant.name}</span>
          {showPrice && <PriceDisplay price={variant.price} size="sm" />}
          {showStock && !variant.inStock && (
            <Badge variant="secondary" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a variant" />
        </SelectTrigger>
        <SelectContent>
          {variants.map((variant) => (
            <SelectItem
              key={variant.id}
              value={variant.id}
              disabled={!variant.inStock}
            >
              <div className="flex items-center justify-between w-full gap-4">
                <span className="flex-1">{variant.name}</span>
                <div className="flex items-center gap-2">
                  {showPrice && (
                    <PriceDisplay price={variant.price} size="sm" />
                  )}
                  {showStock && !variant.inStock && (
                    <Badge variant="secondary" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show selected variant details */}
      {selectedVariant && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {showPrice && <PriceDisplay price={selectedVariant.price} size="sm" />}
          {showStock && selectedVariant.availableQuantity !== undefined && (
            <span>
              {selectedVariant.availableQuantity > 0
                ? `${selectedVariant.availableQuantity} available`
                : 'Out of stock'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple variant button group for fewer options
 */
interface VariantButtonGroupProps {
  variants: Variant[];
  selectedVariantId?: string;
  onVariantChange: (variantId: string) => void;
  className?: string;
}

export function VariantButtonGroup({
  variants,
  selectedVariantId,
  onVariantChange,
  className = '',
}: VariantButtonGroupProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedVariantId || variants[0]?.id || ''
  );

  const selectedId = selectedVariantId ?? internalSelectedId;

  const handleClick = (value: string) => {
    setInternalSelectedId(value);
    onVariantChange(value);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          onClick={() => handleClick(variant.id)}
          disabled={!variant.inStock}
          className={`px-4 py-2 rounded-md border transition-colors ${
            selectedId === variant.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary'
          } ${!variant.inStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {variant.name}
        </button>
      ))}
    </div>
  );
}
