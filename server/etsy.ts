import * as fs from 'fs';
import * as path from 'path';

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

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'etsy-shop.json');
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedEtsyData {
  shopId: string;
  products: Product[];
  timestamp: number;
}

function isCacheValid(cachedData: CachedEtsyData, shopId: string): boolean {
  if (cachedData.shopId !== shopId) {
    return false;
  }
  const now = Date.now();
  const age = now - cachedData.timestamp;
  return age < CACHE_DURATION;
}

function readCache(shopId: string): Product[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedEtsyData = JSON.parse(cacheContent);

    if (isCacheValid(cachedData, shopId)) {
      const ageMinutes = Math.floor((Date.now() - cachedData.timestamp) / (1000 * 60));
      console.log(`Using cached Etsy data (age: ${ageMinutes}m)`);
      return cachedData.products;
    }

    console.log('Etsy cache expired, fetching fresh data');
    return null;
  } catch (error) {
    console.error('Error reading Etsy cache:', error);
    return null;
  }
}

function writeCache(shopId: string, products: Product[]): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheData: CachedEtsyData = {
      shopId,
      products,
      timestamp: Date.now(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('Etsy data cached successfully');
  } catch (error) {
    console.error('Error writing Etsy cache:', error);
  }
}

export async function getShopListings(shopId: string, limit: number = 8): Promise<Product[]> {
  // Check cache first
  const cachedProducts = readCache(shopId);
  if (cachedProducts !== null) {
    return cachedProducts.slice(0, limit);
  }

  // Cache miss or expired, fetch from API
  const apiKey = process.env.ETSY_API_KEY;
  const accessToken = process.env.ETSY_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    console.log('Etsy API credentials not configured - returning empty product list');
    return [];
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
      if (process.env.NODE_ENV === 'development') {
        const errorText = await response.text();
        console.log('⚠️  Etsy API error (expected in local dev):', response.status, errorText);
      } else {
        console.error('Etsy API error:', response.status);
      }
      console.log('Returning empty product list due to API error');
      return [];
    }

    const data: EtsyResponse = await response.json();

    const products = data.results.map((listing) => {
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

    // Cache all products
    writeCache(shopId, products);

    return products.slice(0, limit);
  } catch (error) {
    console.error('Error fetching Etsy listings:', error);
    
    // If API fails, try to return stale cache as fallback
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cachedData: CachedEtsyData = JSON.parse(cacheContent);
        if (cachedData.shopId === shopId) {
          console.log('Etsy API failed, serving stale cache as fallback');
          return cachedData.products.slice(0, limit);
        }
      }
    } catch (cacheError) {
      console.error('Failed to read stale Etsy cache:', cacheError);
    }
    
    console.log('Returning empty product list due to error');
    return [];
  }
}
