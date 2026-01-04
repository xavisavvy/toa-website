import { createServer, type Server } from "http";

import type { Express } from "express";

import { getCharacterData } from "./dndbeyond";
import { getShopListings } from "./etsy";
import { registerHealthRoutes } from "./health";
import { metrics } from "./monitoring";
import { getPodcastFeed } from "./podcast";
import { getPrintfulSyncProducts, getPrintfulProductDetails, getCatalogVariantId as resolveCatalogVariantId, getPrintfulShippingEstimate } from "./printful";
import { apiLimiter, expensiveLimiter } from "./rate-limiter";
import { validateUrl, validateNumber, logSecurityEvent } from "./security";
import { createCheckoutSession, getCheckoutSession, verifyWebhookSignature, createPrintfulOrderFromSession, createPrintfulOrder, STRIPE_CONFIG } from "./stripe";
import { getPlaylistVideos, getChannelVideos, getChannelShorts, getChannelStats } from "./youtube";
import { createOrder, updateOrderWithPrintfulId, logFailedOrder, logOrderEvent, getOrderByStripeSessionId } from "./order-service";
import { sendOrderConfirmation, sendPaymentFailureNotification, sendAdminAlert } from "./notification-service";

export function registerRoutes(app: Express): Server {
  // Apply API rate limiting to all /api routes
  app.use("/api", apiLimiter);

  // Health check endpoints (for Kubernetes, Docker, monitoring)
  registerHealthRoutes(app);
  
  // Metrics endpoint
  app.get("/api/metrics", (req, res) => {
    res.json(metrics.getMetrics());
  });
  // A03: Injection Prevention - Validate YouTube playlist ID
  app.get("/api/youtube/playlist/:playlistId", async (req, res) => {
    try {
      const { playlistId } = req.params;
      
      // A03: Validate playlistId format (YouTube playlist IDs are alphanumeric with hyphens/underscores)
      if (!/^[a-zA-Z0-9_-]+$/.test(playlistId)) {
        logSecurityEvent('INVALID_PLAYLIST_ID', { playlistId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid playlist ID format' });
      }

      // A03: Validate maxResults parameter
      const maxResultsInput = req.query.maxResults as string;
      const validation = validateNumber(maxResultsInput || '1000', 1, 10000);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const videos = await getPlaylistVideos(playlistId, validation.value!);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube playlist' });
    }
  });

  // NEW: Fetch all videos from a YouTube channel (sorted by newest first)
  app.get("/api/youtube/channel/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;

      // A03: Validate channelId format (YouTube channel IDs start with UC)
      if (!/^UC[a-zA-Z0-9_-]+$/.test(channelId)) {
        logSecurityEvent('INVALID_CHANNEL_ID', { channelId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid channel ID format. Channel IDs must start with UC' });
      }

      // A03: Validate maxResults parameter
      const maxResultsInput = req.query.maxResults as string;
      const validation = validateNumber(maxResultsInput || '50', 1, 10000);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const videos = await getChannelVideos(channelId, validation.value!);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube channel videos' });
    }
  });

  // Fetch YouTube Shorts from a channel (videos <= 60 seconds)
  app.get("/api/youtube/channel/:channelId/shorts", async (req, res) => {
    try {
      const { channelId } = req.params;

      // A03: Validate channelId format (YouTube channel IDs start with UC)
      if (!/^UC[a-zA-Z0-9_-]+$/.test(channelId)) {
        logSecurityEvent('INVALID_CHANNEL_ID', { channelId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid channel ID format. Channel IDs must start with UC' });
      }

      // A03: Validate maxResults parameter
      const maxResultsInput = req.query.maxResults as string;
      const validation = validateNumber(maxResultsInput || '50', 1, 10000);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const shorts = await getChannelShorts(channelId, validation.value!);
      res.json(shorts);
    } catch (error) {
      console.error('Error fetching YouTube Shorts:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube Shorts' });
    }
  });

  // YouTube channel statistics endpoint
  app.get("/api/youtube/channel/:channelId/stats", async (req, res) => {
    try {
      const { channelId } = req.params;

      // A03: Validate channelId format (YouTube channel IDs start with UC)
      if (!/^UC[a-zA-Z0-9_-]+$/.test(channelId)) {
        logSecurityEvent('INVALID_CHANNEL_ID', { channelId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid channel ID format. Channel IDs must start with UC' });
      }

      const stats = await getChannelStats(channelId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching YouTube channel stats:', error);
      res.status(500).json({ error: 'Failed to fetch channel statistics' });
    }
  });

  // A10: SSRF Prevention - Validate and sanitize podcast feed URL
  app.post("/api/podcast/feed", expensiveLimiter, async (req, res) => {
    try {
      const { feedUrl, limit } = req.body;
      
      if (!feedUrl) {
        return res.status(400).json({ error: 'feedUrl is required' });
      }

      // A10: SSRF Protection - Validate URL to prevent attacks
      const urlValidation = validateUrl(feedUrl);
      if (!urlValidation.valid) {
        logSecurityEvent('SSRF_ATTEMPT', { 
          feedUrl, 
          ip: req.ip,
          error: urlValidation.error 
        });
        return res.status(400).json({ error: urlValidation.error });
      }

      // A03: Validate limit parameter
      const limitValidation = validateNumber(limit || 10, 1, 50);
      if (!limitValidation.valid) {
        return res.status(400).json({ error: limitValidation.error });
      }
      
      const episodes = await getPodcastFeed(feedUrl, limitValidation.value!);
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      res.status(500).json({ error: 'Failed to fetch podcast feed' });
    }
  });

  // Audio proxy endpoint to bypass CORS restrictions
  // Uses redirect approach for better production reliability
  app.get("/api/podcast/audio-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      // Decode URL if it's double-encoded
      let decodedUrl = url;
      try {
        // Handle multiple levels of encoding
        while (decodedUrl.includes('%25')) {
          decodedUrl = decodeURIComponent(decodedUrl);
        }
      } catch {
        // If decoding fails, use original
      }

      // Validate URL to prevent SSRF attacks
      const urlValidation = validateUrl(decodedUrl);
      if (!urlValidation.valid) {
        logSecurityEvent('SSRF_ATTEMPT', { 
          url: decodedUrl, 
          ip: req.ip,
          error: urlValidation.error 
        });
        return res.status(400).json({ error: urlValidation.error });
      }

      // Only allow audio from known podcast hosting domains
      const allowedDomains = ['anchor.fm', 'cloudfront.net', 'spotify.com', 'apple.com', 'spreaker.com', 'buzzsprout.com', 'libsyn.com', 'podbean.com', 'simplecast.com', 'transistor.fm', 'captivate.fm', 'megaphone.fm', 'omny.fm', 'acast.com'];
      const urlObj = new URL(decodedUrl);
      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname.endsWith(domain) || urlObj.hostname === domain
      );

      if (!isAllowed) {
        logSecurityEvent('UNAUTHORIZED_AUDIO_DOMAIN', { url: decodedUrl, ip: req.ip });
        return res.status(403).json({ error: 'Audio URL from unauthorized domain' });
      }

      // Follow redirects to get the final audio URL
      const controller = new globalThis.AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(decodedUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        globalThis.clearTimeout(timeout);

        // Get the final URL after redirects
        const finalUrl = response.url;
        
        // Redirect client to the actual audio source
        res.redirect(302, finalUrl);
      } catch {
        globalThis.clearTimeout(timeout);
        // If HEAD request fails, try direct redirect
        res.redirect(302, decodedUrl);
      }
    } catch (error: any) {
      console.error('Error proxying audio:', error?.message || error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to proxy audio file' });
      }
    }
  });

  // A03: Injection Prevention - Validate Etsy shop ID
  app.get("/api/etsy/shop/:shopId/listings", async (req, res) => {
    try {
      const { shopId } = req.params;
      
      // A03: Validate shopId format (Etsy shop IDs are alphanumeric)
      if (!/^[a-zA-Z0-9]+$/.test(shopId)) {
        logSecurityEvent('INVALID_SHOP_ID', { shopId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid shop ID format' });
      }

      // A03: Validate limit parameter
      const limitInput = req.query.limit as string;
      const validation = validateNumber(limitInput || '8', 1, 50);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const products = await getShopListings(shopId, validation.value!);
      res.json(products);
    } catch (error) {
      console.error('Error fetching Etsy listings:', error);
      res.status(500).json({ error: 'Failed to fetch Etsy products' });
    }
  });

  // Printful sync products endpoint
  app.get("/api/printful/products", async (req, res) => {
    try {
      // A03: Validate limit parameter
      const limitInput = req.query.limit as string;
      const validation = validateNumber(limitInput || '20', 1, 50);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const products = await getPrintfulSyncProducts(validation.value!);
      res.json(products);
    } catch (error) {
      console.error('Error fetching Printful products:', error);
      res.status(500).json({ error: 'Failed to fetch Printful products' });
    }
  });

  // Printful product details endpoint
  app.get("/api/printful/products/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      
      // A03: Validate productId format (Printful product IDs are numeric)
      if (!/^\d+$/.test(productId)) {
        logSecurityEvent('INVALID_PRODUCT_ID', { productId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid product ID format' });
      }
      
      const product = await getPrintfulProductDetails(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error fetching Printful product:', error);
      res.status(500).json({ error: 'Failed to fetch product details' });
    }
  });

  // Printful: Calculate shipping estimate (simple zip code-based)
  app.post("/api/printful/shipping/estimate", async (req, res) => {
    try {
      const { variantId, zipCode, quantity } = req.body;

      // Validate inputs
      if (!variantId || !zipCode) {
        return res.status(400).json({ error: 'Missing required fields: variantId, zipCode' });
      }

      // Basic zip code validation (US/CA) - simplified to avoid regex issues
      const zipTrimmed = zipCode.trim();
      if (zipTrimmed.length < 5 || zipTrimmed.length > 10) {
        return res.status(400).json({ error: 'Invalid zip/postal code format' });
      }

      // Parse US zip code to get state info (rough estimate)
      const zip = zipCode.substring(0, 5);
      const isUSZip = /^\d{5}$/.test(zip);
      
      // Default shipping address (placeholder - would normally geocode the zip)
      const recipient = {
        address1: '123 Main St',
        city: isUSZip ? 'New York' : 'Toronto',
        state_code: isUSZip ? 'NY' : 'ON',
        country_code: isUSZip ? 'US' : 'CA',
        zip: zipCode,
      };

      const estimate = await getPrintfulShippingEstimate({
        recipient,
        items: [{
          sync_variant_id: parseInt(variantId),
          quantity: quantity || 1,
        }],
      });

      if (!estimate) {
        return res.status(500).json({ error: 'Failed to calculate shipping estimate' });
      }

      // Calculate total
      const basePrice = parseFloat(req.body.basePrice || '0');
      const subtotal = basePrice * (quantity || 1);
      const total = subtotal + estimate.shipping + estimate.tax;

      res.json({
        subtotal,
        shipping: estimate.shipping,
        tax: estimate.tax,
        total,
        rates: estimate.rates.map(rate => ({
          id: rate.id,
          name: rate.name,
          rate: rate.rate,
          minDays: rate.min_delivery_days,
          maxDays: rate.max_delivery_days,
        })),
      });
    } catch (error) {
      console.error('Error calculating shipping estimate:', error);
      res.status(500).json({ error: 'Failed to calculate shipping' });
    }
  });

  // Backward compatibility: old shipping estimate endpoint
  app.post("/api/printful/shipping-estimate", async (req, res) => {
    try {
      const { variantId, quantity, recipient, items } = req.body;

      // Validate inputs - support both single item (legacy) and multi-item (cart)
      if (!recipient) {
        return res.status(400).json({ error: 'Missing required field: recipient' });
      }

      if (!recipient.address1 || !recipient.city || !recipient.state_code || !recipient.country_code || !recipient.zip) {
        return res.status(400).json({ error: 'Missing required recipient fields' });
      }

      // Build items array - support both formats
      let itemsToEstimate;
      if (items && Array.isArray(items) && items.length > 0) {
        // Multi-item cart format
        itemsToEstimate = items.map(item => ({
          sync_variant_id: parseInt(item.variantId),
          quantity: item.quantity || 1,
        }));
      } else if (variantId) {
        // Single item format (legacy)
        itemsToEstimate = [{
          sync_variant_id: parseInt(variantId),
          quantity: quantity || 1,
        }];
      } else {
        return res.status(400).json({ error: 'Missing required field: variantId or items' });
      }

      const estimate = await getPrintfulShippingEstimate({
        recipient: {
          address1: recipient.address1,
          address2: recipient.address2 || null,
          city: recipient.city,
          state_code: recipient.state_code,
          country_code: recipient.country_code,
          zip: recipient.zip,
        },
        items: itemsToEstimate,
      });

      if (!estimate) {
        return res.status(500).json({ error: 'Failed to calculate shipping estimate' });
      }

      res.json({
        shipping: estimate.shipping,
        tax: estimate.tax,
        rates: estimate.rates,
        costs: estimate.costs,
      });
    } catch (error) {
      console.error('Error calculating shipping estimate:', error);
      res.status(500).json({ error: 'Failed to calculate shipping' });
    }
  });

  // Cart-specific shipping estimate endpoint
  // Simplified endpoint for cart checkout flow
  app.post("/api/printful/shipping/estimate-cart", async (req, res) => {
    try {
      const { items, zipCode } = req.body;

      // Validate inputs
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required field: items' });
      }

      if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
        return res.status(400).json({ error: 'Invalid zip code format' });
      }

      // Convert items to Printful format
      const itemsToEstimate = items.map(item => ({
        sync_variant_id: parseInt(item.variantId),
        quantity: item.quantity || 1,
      }));

      // Use a default US address with the provided zip code
      // Printful only needs zip code for US domestic shipping estimates
      const estimate = await getPrintfulShippingEstimate({
        recipient: {
          address1: '123 Main St', // Placeholder - not used for rate calculation
          address2: null,
          city: 'Any City', // Placeholder - not used for rate calculation
          state_code: zipCode.length >= 5 ? 'US' : 'US', // Could parse state from zip if needed
          country_code: 'US',
          zip: zipCode.slice(0, 5), // Use only 5-digit zip
        },
        items: itemsToEstimate,
      });

      if (!estimate) {
        return res.status(500).json({ error: 'Failed to calculate shipping estimate' });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
      const total = subtotal + estimate.shipping + estimate.tax;

      res.json({
        subtotal,
        shipping: estimate.shipping,
        tax: estimate.tax,
        total,
        rates: estimate.rates?.map(rate => ({
          id: rate.id,
          name: rate.name,
          rate: parseFloat(rate.rate),
          minDays: rate.min_delivery_days,
          maxDays: rate.max_delivery_days,
        })) || [],
      });
    } catch (error) {
      console.error('Error calculating cart shipping estimate:', error);
      res.status(500).json({ error: 'Failed to calculate shipping' });
    }
  });

  // Stripe Checkout: Create checkout session
  app.post("/api/stripe/create-checkout", async (req, res) => {
    try {
      const { productId, variantId, productName, price, quantity, imageUrl, shipping } = req.body;

      // Validate inputs
      if (!productId || !variantId || !productName || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!/^\d+$/.test(productId) || !/^\d+$/.test(variantId)) {
        return res.status(400).json({ error: 'Invalid product or variant ID' });
      }

      const priceInCents = Math.round(parseFloat(price) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        return res.status(400).json({ error: 'Invalid price' });
      }

      // Parse shipping estimate if provided
      let shippingEstimate;
      if (shipping && typeof shipping.shipping === 'number' && typeof shipping.tax === 'number') {
        shippingEstimate = {
          shipping: shipping.shipping,
          tax: shipping.tax,
        };
      }

      const session = await createCheckoutSession({
        productId,
        variantId,
        productName,
        price: priceInCents,
        quantity: quantity || 1,
        imageUrl,
        shippingEstimate,  // Pass Printful's exact costs if available
      });

      if (!session) {
        return res.status(500).json({ error: 'Failed to create checkout session' });
      }

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Stripe: Get checkout session details
  app.get("/api/stripe/checkout/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId.startsWith('cs_')) {
        return res.status(400).json({ error: 'Invalid session ID format' });
      }

      const session = await getCheckoutSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
      });
    } catch (error) {
      console.error('Error fetching checkout session:', error);
      res.status(500).json({ error: 'Failed to fetch session details' });
    }
  });

  /* eslint-disable no-console, @typescript-eslint/no-explicit-any, sonarjs/cognitive-complexity */
  // Stripe Webhook: Handle payment events
  // Track processed sessions to prevent duplicate orders
  const processedSessions = new Set<string>();

  app.post("/api/stripe/webhook", async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      const event = verifyWebhookSignature(req.body, signature as string, webhookSecret);

      if (!event) {
        return res.status(400).send('Invalid signature');
      }

      console.log('Webhook event received:', event.type);

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const eventSession = event.data.object as any;
          const sessionId = eventSession.id;
          
          // Idempotency check - prevent duplicate order creation
          if (processedSessions.has(sessionId)) {
            console.log(`⚠️  Session ${sessionId} already processed, skipping duplicate webhook`);
            return res.json({ received: true, duplicate: true });
          }
          
          console.log('✅ Payment successful:', sessionId);
          console.log('Customer email:', eventSession.customer_details?.email);
          console.log('Amount paid:', eventSession.amount_total / 100, eventSession.currency.toUpperCase());
          
          // Fetch full session with shipping details (not included in webhook by default)
          const fullSession = await getCheckoutSession(eventSession.id);
          
          if (!fullSession) {
            console.error('❌ Failed to retrieve full session data');
            await sendAdminAlert(
              'Failed to retrieve Stripe session',
              `Could not fetch full session data for ${sessionId}`,
              { sessionId }
            );
            break;
          }

          // Create order record in database
          try {
            const orderData = {
              stripeSessionId: sessionId,
              stripePaymentIntentId: fullSession.payment_intent as string,
              customerEmail: fullSession.customer_details?.email || '',
              customerName: fullSession.customer_details?.name || undefined,
              totalAmount: (fullSession.amount_total! / 100).toFixed(2),
              currency: fullSession.currency || 'usd',
              shippingAddress: (fullSession as any).shipping_details?.address ? {
                name: (fullSession as any).shipping_details.name || '',
                line1: (fullSession as any).shipping_details.address.line1 || '',
                line2: (fullSession as any).shipping_details.address.line2,
                city: (fullSession as any).shipping_details.address.city || '',
                state: (fullSession as any).shipping_details.address.state || '',
                postal_code: (fullSession as any).shipping_details.address.postal_code || '',
                country: (fullSession as any).shipping_details.address.country || '',
              } : undefined,
              items: fullSession.line_items?.data.map(item => ({
                printfulProductId: fullSession.metadata?.printful_product_id || '',
                printfulVariantId: fullSession.metadata?.printful_variant_id || '',
                name: item.description || '',
                quantity: item.quantity || 1,
                price: ((item.amount_total || 0) / 100).toFixed(2),
                imageUrl: undefined,
              })) || [],
              metadata: fullSession.metadata || undefined,
            };

            const order = await createOrder(orderData);
            console.log(`✅ Order created in database: ${order.id}`);
          } catch (dbError) {
            console.error('❌ Failed to create order in database:', dbError);
            await sendAdminAlert(
              'Database Error: Failed to create order',
              `Error creating order for session ${sessionId}`,
              { sessionId, error: String(dbError) }
            );
          }
          
          // Get sync variant ID from metadata
          const syncVariantId = fullSession.metadata?.printful_variant_id;
          if (!syncVariantId) {
            console.error('❌ No Printful variant ID in session metadata');
            console.error('Session metadata:', fullSession.metadata);
            await sendAdminAlert(
              'Missing Printful Variant ID',
              `No variant ID in metadata for session ${sessionId}`,
              { sessionId, metadata: fullSession.metadata }
            );
            break;
          }

          console.log(`🔄 Converting sync variant ${syncVariantId} to catalog variant...`);
          
          // Convert sync variant ID to catalog variant ID
          const catalogVariantId = await resolveCatalogVariantId(syncVariantId);
          if (!catalogVariantId) {
            console.error(`❌ Could not resolve catalog variant ID for sync variant ${syncVariantId}`);
            console.error('⚠️  CRITICAL: Payment was successful but order cannot be auto-fulfilled');
            
            // Store failed order and alert admin
            await logFailedOrder(
              sessionId,
              'printful_variant_resolution_failed',
              `Could not resolve catalog variant ID for sync variant ${syncVariantId}`,
              {
                syncVariantId,
                customerEmail: eventSession.customer_details?.email,
                amountPaid: eventSession.amount_total / 100,
                currency: eventSession.currency,
              }
            );

            await sendAdminAlert(
              'CRITICAL: Printful Variant Resolution Failed',
              `Payment successful but cannot fulfill order automatically.\n\nManual Action Required:\n- Check session: https://dashboard.stripe.com/payments/${eventSession.id}\n- Check variant: https://api.printful.com/store/variants/${syncVariantId}\n- Manually create Printful order for: ${eventSession.customer_details?.email}\n- Amount paid: $${eventSession.amount_total / 100} ${eventSession.currency.toUpperCase()}`,
              {
                sessionId: eventSession.id,
                syncVariantId,
                customerEmail: eventSession.customer_details?.email,
                amountPaid: eventSession.amount_total / 100,
              }
            );
            
            console.log('✅ Webhook acknowledged, but order needs manual fulfillment');
            break;
          }

          console.log(`✅ Resolved variant: sync=${syncVariantId} → catalog=${catalogVariantId}`);
          
          // Note: For sync products in Printful, use sync_variant_id (not variant_id)
          // The files are already associated with the sync variant, no need to send them
          console.log(`📦 Creating Printful order with sync variant ${syncVariantId}...`);
          
          const orderData = createPrintfulOrderFromSession(fullSession);
          if (orderData) {
            // Order data already uses sync_variant_id from createPrintfulOrderFromSession
            console.log('Recipient:', orderData.recipient.name, orderData.recipient.email);
            console.log('Items:', orderData.items.map(i => ({ 
              sync_variant_id: i.sync_variant_id,
              quantity: i.quantity
            })));
            
            const result = await createPrintfulOrder(orderData);
            
            if (result.success) {
              console.log(`✅ Printful order created successfully! Order ID: ${result.orderId}`);
              console.log(`Order will be fulfilled and shipped by Printful`);
              
              // Mark session as processed to prevent duplicates
              processedSessions.add(sessionId);
              
              // Clean up old sessions (keep last 1000 to prevent memory leak)
              if (processedSessions.size > 1000) {
                const sessionsArray = Array.from(processedSessions);
                processedSessions.clear();
                sessionsArray.slice(-500).forEach(id => processedSessions.add(id));
              }
              
              // Update order with Printful ID
              try {
                const order = await getOrderByStripeSessionId(sessionId);
                if (order) {
                  await updateOrderWithPrintfulId(order.id, String(result.orderId!));
                  
                  // Send confirmation email to customer
                  const items = [{
                    name: 'Tales of Aneria Merchandise',
                    quantity: 1,
                    price: ((fullSession.amount_total || 0) / 100).toFixed(2),
                  }];
                  
                  await sendOrderConfirmation(order, items);
                  console.log(`✅ Order confirmation email sent to ${order.customerEmail}`);
                } else {
                  console.error('❌ Could not find order in database to update');
                }
              } catch (notificationError) {
                console.error('❌ Error sending confirmation email:', notificationError);
                await sendAdminAlert(
                  'Failed to send order confirmation',
                  `Email notification failed for session ${sessionId}`,
                  { sessionId, error: String(notificationError) }
                );
              }
            } else {
              console.error(`❌ Failed to create Printful order: ${result.error}`);
              console.error('Order data:', JSON.stringify(orderData, null, 2));
              
              // Store failed order in database
              await logFailedOrder(
                sessionId,
                'printful_order_creation_failed',
                result.error || 'Unknown error creating Printful order',
                { orderData, error: result.error }
              );

              // Alert admin about failed order creation
              await sendAdminAlert(
                'Failed to create Printful order',
                `Printful order creation failed for session ${sessionId}\n\nError: ${result.error}\n\nCustomer: ${eventSession.customer_details?.email}\nAmount: $${eventSession.amount_total / 100} ${eventSession.currency.toUpperCase()}`,
                {
                  sessionId,
                  error: result.error,
                  customerEmail: eventSession.customer_details?.email,
                  orderData,
                }
              );
            }
          } else {
            console.error('❌ Could not extract order data from Stripe session');
            console.error('Session ID:', eventSession.id);
            
            await logFailedOrder(
              sessionId,
              'order_data_extraction_failed',
              'Could not extract order data from Stripe session',
              { sessionId }
            );

            await sendAdminAlert(
              'Failed to extract order data',
              `Could not extract order data from Stripe session ${sessionId}`,
              { sessionId }
            );
          }
          
          break;
        }

        case 'checkout.session.async_payment_succeeded': {
          console.log('✅ Async payment succeeded');
          const asyncEventSession = event.data.object as any;
          const asyncSession = await getCheckoutSession(asyncEventSession.id);
          
          if (asyncSession) {
            const asyncOrderData = createPrintfulOrderFromSession(asyncSession);
            if (asyncOrderData) {
              const result = await createPrintfulOrder(asyncOrderData);
              
              if (result.success && result.orderId) {
                const order = await getOrderByStripeSessionId(asyncEventSession.id);
                if (order) {
                  await updateOrderWithPrintfulId(order.id, String(result.orderId));
                  
                  const items = [{
                    name: 'Tales of Aneria Merchandise',
                    quantity: 1,
                    price: ((asyncSession.amount_total || 0) / 100).toFixed(2),
                  }];
                  
                  await sendOrderConfirmation(order, items);
                }
              } else {
                await logFailedOrder(
                  asyncEventSession.id,
                  'async_printful_order_failed',
                  result.error || 'Unknown error',
                  { error: result.error }
                );
                
                await sendAdminAlert(
                  'Async Printful order creation failed',
                  `Failed to create Printful order for async payment session ${asyncEventSession.id}`,
                  { sessionId: asyncEventSession.id, error: result.error }
                );
              }
            }
          }
          break;
        }

        case 'checkout.session.async_payment_failed': {
          console.log('❌ Async payment failed');
          const failedSession = event.data.object as any;
          console.log('Failed session ID:', failedSession.id);
          
          const customerEmail = failedSession.customer_details?.email;
          if (customerEmail) {
            await sendPaymentFailureNotification(customerEmail, failedSession.id);
          }

          await logFailedOrder(
            failedSession.id,
            'async_payment_failed',
            'Async payment method failed',
            {
              customerEmail,
              reason: failedSession.last_payment_error?.message,
            }
          );

          await sendAdminAlert(
            'Async payment failed',
            `Async payment failed for session ${failedSession.id}\n\nCustomer: ${customerEmail}`,
            { sessionId: failedSession.id, customerEmail }
          );
          
          break;
        }

        default:
          console.log(`ℹ️  Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send('Webhook error');
    }
  });

  // Get Stripe config (publishable key for client-side)
  app.get("/api/stripe/config", (req, res) => {
    res.json({
      publishableKey: STRIPE_CONFIG.publishableKey,
    });
  });

  // A03: Injection Prevention - Validate D&D Beyond character ID
  app.get("/api/dndbeyond/character/:characterId", async (req, res) => {
    try {
      const { characterId } = req.params;
      
      // A03: Validate characterId format (D&D Beyond character IDs are numeric)
      if (!/^\d+$/.test(characterId)) {
        logSecurityEvent('INVALID_CHARACTER_ID', { characterId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid character ID format' });
      }
      
      const characterData = await getCharacterData(characterId);
      res.json(characterData);
    } catch (error) {
      console.error('Error fetching D&D Beyond character:', error);
      res.status(500).json({ error: 'Failed to fetch character data' });
    }
  });

  // D&D Beyond avatar proxy to bypass CORS/CORB
  app.get("/api/dndbeyond/avatars/:characterId/avatar.jpg", async (req, res) => {
    const { characterId } = req.params;

    try {
      // Validate characterId format
      if (!/^\d+$/.test(characterId)) {
        logSecurityEvent('INVALID_CHARACTER_ID', { characterId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid character ID format' });
      }

      const imageUrl = `https://www.dndbeyond.com/avatars/${characterId}/avatar.jpg`;
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.dndbeyond.com/',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'same-origin',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to fetch D&D Beyond avatar',
          status: response.status,
        });
      }

      // Get the image buffer
      const imageBuffer = await response.arrayBuffer();
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Send the image
      res.send(Buffer.from(imageBuffer));
    } catch (error) {
      console.error('Error proxying D&D Beyond avatar:', error);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  // Sponsorship contact form endpoint
  app.post("/api/contact/sponsor", async (req, res) => {
    try {
      const { name, email, company, interest, message } = req.body;

      // Basic validation
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Log the sponsorship inquiry
      console.log('📧 Sponsorship Inquiry Received:', {
        name,
        email,
        company: company || 'N/A',
        interest: interest || 'N/A',
        timestamp: new Date().toISOString(),
      });

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // For now, we just log it. In production, you'd want to:
      // 1. Send email notification to sponsors@talesofaneria.com
      // 2. Store inquiry in database
      // 3. Send auto-reply to inquirer
      
      // Simulate email sending (replace with actual email service)
      const emailData = {
        to: 'sponsors@talesofaneria.com',
        from: 'noreply@talesofaneria.com',
        subject: `New Sponsorship Inquiry from ${company || name}`,
        html: `
          <h2>New Sponsorship Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'Not provided'}</p>
          <p><strong>Interest:</strong> ${interest || 'Not specified'}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      };

      console.log('📧 Email would be sent:', emailData);

      // Return success
      res.json({
        success: true,
        message: 'Thank you for your interest! We will be in touch soon.',
      });
    } catch (error) {
      console.error('Error processing sponsorship inquiry:', error);
      res.status(500).json({ error: 'Failed to submit sponsorship inquiry' });
    }
  });

  return createServer(app);
}
