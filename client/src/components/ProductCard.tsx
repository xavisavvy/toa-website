import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  image: string;
  inStock: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  inStock,
  onClick,
  className = '',
}: ProductCardProps) {
  return (
    <Card
      className={`overflow-hidden hover-elevate cursor-pointer transition-all ${className}`}
      data-testid={`card-printful-product-${id}`}
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full"
          width="400"
          height="400"
          loading="lazy"
        />
        {!inStock && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3"
            data-testid={`badge-printful-product-${id}`}
          >
            Sold Out
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3
          className="font-semibold mb-2 line-clamp-2"
          data-testid={`text-printful-product-name-${id}`}
        >
          {name}
        </h3>
        <p
          className="text-primary font-semibold"
          data-testid={`text-printful-product-price-${id}`}
        >
          {price}
        </p>
      </CardContent>
    </Card>
  );
}
