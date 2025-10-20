interface EtsyPrice {
  amount: number;
  divisor: number;
  currency_code: string;
}

interface EtsyImage {
  url_570xN: string;
  url_fullxfull: string;
}

interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  state: string;
  price: EtsyPrice;
  quantity: number;
  url: string;
  images?: EtsyImage[];
}

interface EtsyResponse {
  count: number;
  results: EtsyListing[];
}

export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  inStock: boolean;
}

export async function getShopListings(shopId: string, limit: number = 8): Promise<Product[]> {
  const apiKey = process.env.ETSY_API_KEY;
  const accessToken = process.env.ETSY_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    throw new Error('Etsy API credentials not configured');
  }

  const url = `https://openapi.etsy.com/v3/application/shops/${shopId}/listings`;
  
  const params = new URLSearchParams({
    state: 'active',
    limit: limit.toString(),
    includes: 'Images',
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'x-api-key': apiKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Etsy API error:', response.status, errorText);
      throw new Error(`Etsy API error: ${response.status}`);
    }

    const data: EtsyResponse = await response.json();

    return data.results.map((listing) => {
      const priceInDollars = listing.price.amount / listing.price.divisor;
      const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: listing.price.currency_code,
      }).format(priceInDollars);

      // Get the best quality image available
      const imageUrl = listing.images && listing.images.length > 0
        ? listing.images[0].url_570xN
        : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop';

      return {
        id: listing.listing_id.toString(),
        name: listing.title,
        price: formattedPrice,
        image: imageUrl,
        url: listing.url,
        inStock: listing.quantity > 0,
      };
    });
  } catch (error) {
    console.error('Error fetching Etsy listings:', error);
    throw error;
  }
}
