interface PriceDisplayProps {
  price: string | number;
  className?: string;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({
  price,
  className = '',
  showCurrency = true,
  size = 'md',
}: PriceDisplayProps) {
  const formatPrice = (value: string | number): string => {
    // If already formatted (e.g., "$29.99"), return as-is
    if (typeof value === 'string' && value.includes('$')) {
      return value;
    }

    // Convert to number and format
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return showCurrency ? '$0.00' : '0.00';
    }

    const formatted = numValue.toFixed(2);
    return showCurrency ? `$${formatted}` : formatted;
  };

  /* eslint-disable security/detect-object-injection */
  const sizeClasses: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const sizeClass = sizeClasses[size] || sizeClasses['md'];
  /* eslint-enable security/detect-object-injection */

  return (
    <span className={`font-semibold ${sizeClass} ${className}`}>
      {formatPrice(price)}
    </span>
  );
}

/**
 * Extract numeric price from formatted string
 * @example parsePrice("$29.99") => 29.99
 * @example parsePrice("$19.99 - $29.99") => 19.99
 */
export function parsePrice(priceStr: string): number {
  const match = priceStr.match(/\$?([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Format price consistently across the app
 * @example formatPriceString(29.99) => "$29.99"
 */
export function formatPriceString(price: number): string {
  return `$${price.toFixed(2)}`;
}
