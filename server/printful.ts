/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

interface PrintfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

interface PrintfulSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  currency: string;
  is_ignored: boolean;
  sku: string | null;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: Array<{
    id: number;
    type: string;
    hash: string | null;
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    dpi: number | null;
    status: string;
    created: number;
    thumbnail_url: string;
    preview_url: string;
    visible: boolean;
  }>;
}

export interface PrintfulProductDisplay {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  inStock: boolean;
  description?: string;
  variants?: Array<{
    id: string;
    name: string;
    price: string;
    inStock: boolean;
  }>;
}

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'printful-products.json');
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedPrintfulData {
  products: PrintfulProductDisplay[];
  timestamp: number;
}

function isCacheValid(cachedData: CachedPrintfulData): boolean {
  const now = Date.now();
  const age = now - cachedData.timestamp;
  return age < CACHE_DURATION;
}

function readCache(): PrintfulProductDisplay[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cachedData: CachedPrintfulData = JSON.parse(cacheContent);

    if (isCacheValid(cachedData)) {
      const ageMinutes = Math.floor((Date.now() - cachedData.timestamp) / (1000 * 60));
      console.log(`Using cached Printful data (age: ${ageMinutes}m)`);
      return cachedData.products;
    }

    console.log('Printful cache expired, fetching fresh data');
    return null;
  } catch (error) {
    console.error('Error reading Printful cache:', error);
    return null;
  }
}

function writeCache(products: PrintfulProductDisplay[]): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheData: CachedPrintfulData = {
      products,
      timestamp: Date.now(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('Printful data cached successfully');
  } catch (error) {
    console.error('Error writing Printful cache:', error);
  }
}

/**
 * Fetch products from Printful Sync Products API
 * These are products you've already created and configured in your Printful store
 */
export async function getPrintfulSyncProducts(limit: number = 20): Promise<PrintfulProductDisplay[]> {
  // Check cache first
  const cachedProducts = readCache();
  if (cachedProducts !== null) {
    return cachedProducts.slice(0, limit);
  }

  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    console.log('Printful API key not configured - returning empty product list');
    return [];
  }

  try {
    // Fetch sync products (products you've created in Printful)
    const response = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Printful API error:', response.status);
      console.error('Error details:', errorText);
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Make sure you have created sync products in your Printful dashboard');
        console.log('⚠️  Visit: https://www.printful.com/dashboard/sync-products');
      }
      return [];
    }

    const data = await response.json();
    const syncProducts: PrintfulSyncProduct[] = data.result || [];

    // Fetch detailed info for each product (including variants with pricing)
    const productDetailsPromises = syncProducts.map(async (product) => {
      try {
        const detailResponse = await fetch(`https://api.printful.com/store/products/${product.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!detailResponse.ok) {
          console.error(`Failed to fetch details for product ${product.id}`);
          return null;
        }

        const detailData = await detailResponse.json();
        const syncVariants: PrintfulSyncVariant[] = detailData.result?.sync_variants || [];

        // Get the lowest price variant
        const prices = syncVariants
          .filter(v => !v.is_ignored && v.synced)
          .map(v => parseFloat(v.retail_price));
        
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        
        const priceDisplay = minPrice === maxPrice
          ? `$${minPrice.toFixed(2)}`
          : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

        // Check if any variant is in stock
        const inStock = syncVariants.some(v => !v.is_ignored && v.synced);

        return {
          id: product.id.toString(),
          name: product.name,
          price: priceDisplay,
          image: product.thumbnail_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop',
          url: `/shop/product/${product.id}`, // Internal product page
          inStock: inStock && !product.is_ignored,
          variants: syncVariants
            .filter(v => !v.is_ignored && v.synced)
            .map(v => ({
              id: v.id.toString(),
              name: v.name,
              price: `$${parseFloat(v.retail_price).toFixed(2)}`,
              inStock: v.synced,
            })),
        };
      } catch (error) {
        console.error(`Error fetching product details for ${product.id}:`, error);
        return null;
      }
    });

    const productDetails = await Promise.all(productDetailsPromises);
    const products = productDetails.filter((p): p is PrintfulProductDisplay => p !== null);

    // Cache the products
    writeCache(products);

    return products.slice(0, limit);
  } catch (error) {
    console.error('Error fetching Printful products:', error);
    
    // Try to return stale cache as fallback
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cachedData: CachedPrintfulData = JSON.parse(cacheContent);
        console.log('Printful API failed, serving stale cache as fallback');
        return cachedData.products.slice(0, limit);
      }
    } catch (cacheError) {
      console.error('Failed to read stale Printful cache:', cacheError);
    }
    
    return [];
  }
}

/**
 * Get details for a single Printful product
 */
export async function getPrintfulProductDetails(productId: string): Promise<PrintfulProductDisplay | null> {
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    console.log('Printful API key not configured');
    return null;
  }

  try {
    const response = await fetch(`https://api.printful.com/store/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch product ${productId}`);
      return null;
    }

    const data = await response.json();
    const product = data.result?.sync_product;
    const syncVariants: PrintfulSyncVariant[] = data.result?.sync_variants || [];

    if (!product) {
      return null;
    }

    const prices = syncVariants
      .filter(v => !v.is_ignored && v.synced)
      .map(v => parseFloat(v.retail_price));
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const priceDisplay = minPrice === maxPrice
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

    return {
      id: product.id.toString(),
      name: product.name,
      price: priceDisplay,
      image: product.thumbnail_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop',
      url: `/shop/product/${product.id}`,
      inStock: syncVariants.some(v => !v.is_ignored && v.synced),
      variants: syncVariants
        .filter(v => !v.is_ignored && v.synced)
        .map(v => ({
          id: v.id.toString(),
          name: v.name,
          price: `$${parseFloat(v.retail_price).toFixed(2)}`,
          inStock: v.synced,
        })),
    };
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

/**
 * Get catalog variant ID from sync variant ID
 */
export async function getCatalogVariantId(syncVariantId: string): Promise<number | null> {
  console.log(`[getCatalogVariantId] Called with syncVariantId: ${syncVariantId}`);
  
  const apiKey = process.env.PRINTFUL_API_KEY;

  if (!apiKey) {
    console.error('[getCatalogVariantId] Printful API key not configured');
    return null;
  }

  console.log('[getCatalogVariantId] API key is configured, proceeding with fetch...');

  try {
    console.log(`🔍 Fetching catalog variant for sync variant: ${syncVariantId}`);
    const url = `https://api.printful.com/store/variants/${syncVariantId}`;
    console.log(`[getCatalogVariantId] Fetching URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[getCatalogVariantId] Response status: ${response.status}, ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch sync variant ${syncVariantId}: ${response.status}`);
      console.error(`Response body: ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`[getCatalogVariantId] Full API response:`, JSON.stringify(data, null, 2).substring(0, 2000));
    
    const variant: PrintfulSyncVariant = data.result?.sync_variant;
    
    if (!variant) {
      console.error(`No sync_variant found in response for ${syncVariantId}`);
      console.error(`Response structure:`, JSON.stringify(data, null, 2));
      return null;
    }
    
    console.log(`[getCatalogVariantId] Found variant, checking for variant_id...`);
    console.log(`[getCatalogVariantId] Variant keys:`, Object.keys(variant).join(', '));
    console.log(`[getCatalogVariantId] variant.variant_id:`, variant?.variant_id);
    console.log(`[getCatalogVariantId] variant.product_id:`, variant?.product_id);
    console.log(`[getCatalogVariantId] variant.product?.variant_id:`, variant?.product?.variant_id);
    
    // Try multiple possible locations for the catalog variant ID
    const catalogId = variant?.variant_id 
      || variant?.product?.variant_id 
      || variant?.product_id;  // Sometimes Printful uses product_id as the catalog ID
    
    if (!catalogId) {
      console.error(`No variant_id found in sync variant ${syncVariantId}`);
      console.error(`Variant data:`, JSON.stringify(variant, null, 2));
      return null;
    }
    
    console.log(`✅ Resolved: sync variant ${syncVariantId} → catalog variant ${catalogId}`);
    return catalogId;
  } catch (error) {
    console.error(`[getCatalogVariantId] Exception caught:`, error);
    console.error(`Error fetching sync variant ${syncVariantId}:`, error);
    return null;
  }
}
