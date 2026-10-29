import { createHmac, timingSafeEqual } from "crypto";
import { createServer, type Server } from "http";

import { eq, desc, gte } from 'drizzle-orm';
import express, { type Express } from "express";
import validator from "validator";
import { z } from "zod";

import { orders, orderItems, orderEvents, auditLogs , loginSchema } from "../shared/schema";
import type { User } from "../shared/schema";

import { AuditService, AuditAction } from "./audit";
import { authenticateUser, getUserById } from "./auth";
import { requireAdmin, optionalAuth } from "./auth-middleware";
import { db } from "./db";
import { getCharacterData } from "./dndbeyond";
import { getShopListings, isAllowedShop, MAX_SHOP_LISTINGS } from "./etsy";
import { registerHealthRoutes } from "./health";
import { safeLog, maskEmail } from "./log-sanitizer";
import { metrics } from "./monitoring";
import { sendOrderConfirmation, sendPaymentFailureNotification, sendAdminAlert } from "./notification-service";
import { createOrder, updateOrderWithPrintfulId, logFailedOrder, getOrderByStripeSessionId, isUniqueViolation } from "./order-service";
import { findCachedEpisodeAudioUrl, getPodcastFeed } from "./podcast";
import { getPrintfulSyncProducts, getPrintfulProductDetails, getCatalogVariantId as resolveCatalogVariantId, getPrintfulShippingEstimate, getSyncVariantForCheckout } from "./printful";
import { apiLimiter, authLimiter, loginAccountLimiter } from "./rate-limiter";
import { validateUrl, validateNumber, logSecurityEvent } from "./security";
import { createCheckoutSession, getCheckoutSession, verifyWebhookSignature, createPrintfulOrderFromSession, createPrintfulOrder, STRIPE_CONFIG } from "./stripe";
import { getPlaylistVideos, getChannelVideos, getChannelShorts, getChannelStats, isAllowedChannel, MAX_CHANNEL_RESULTS } from "./youtube";



// Extend Express Session to include user
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

const DATABASE_NOT_AVAILABLE_ERROR = 'Database not available';
const SERVER_ERROR = 'Server error';

// Admin list filters. Express's query parser can turn ?a[b]=c into an object,
// so every field is a bounded scalar.
const adminFilterSchema = z.string().max(100).optional();
const adminDateSchema = z.coerce.date().refine(date => !isNaN(date.getTime())).optional();
const adminOrdersQuerySchema = z.object({
  status: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});
const adminAuditLogsQuerySchema = z.object({
  category: adminFilterSchema,
  severity: adminFilterSchema,
  action: adminFilterSchema,
  userId: adminFilterSchema,
  startDate: adminDateSchema,
  endDate: adminDateSchema,
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
});

// Shipping estimates forward items to the Printful API, so bound every field
const variantIdSchema = z.union([
  z.string().regex(/^\d{1,20}$/),
  z.number().int().positive(),
]).transform(String);
// Estimates only (nothing is charged), so allow larger carts than checkout does
const shippingQuantitySchema = z.number().int().min(1).max(100).default(1);
const shippingItemSchema = z.object({
  variantId: variantIdSchema,
  quantity: shippingQuantitySchema,
  basePrice: z.number().min(0).max(10000).optional(),
});
const singleShippingEstimateSchema = z.object({
  variantId: variantIdSchema,
  zipCode: z.string().trim().min(5).max(10),
  quantity: shippingQuantitySchema,
  basePrice: z.union([z.string().max(20), z.number().min(0).max(10000)]).optional(),
});
const legacyShippingEstimateSchema = z.object({
  variantId: variantIdSchema.optional(),
  quantity: shippingQuantitySchema,
  recipient: z.object({
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).nullish(),
    city: z.string().min(1).max(100),
    state_code: z.string().min(1).max(10),
    country_code: z.string().length(2),
    zip: z.string().min(1).max(20),
  }),
  items: z.array(shippingItemSchema).max(20).optional(),
});
const cartShippingEstimateSchema = z.object({
  items: z.array(shippingItemSchema).min(1).max(20),
  zipCode: z.string().max(10),
});

const sponsorInquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(254).email(),
  company: z.string().trim().max(200).optional(),
  interest: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

/**
 * The product line for the order confirmation email: the paid quantity at
 * its per-unit price. The order total, which also covers shipping and tax,
 * is shown separately in the email. Without expanded line items, fall back
 * to a single line carrying the order total.
 */
function confirmationEmailItems(session: {
  amount_total?: number | null;
  line_items?: { data: Array<{ quantity?: number | null; amount_total?: number | null }> } | null;
}): Array<{ name: string; quantity: number; price: string }> {
  const name = 'Tales of Aneria Merchandise';
  const line = session.line_items?.data[0];
  if (line?.quantity && typeof line.amount_total === 'number') {
    return [{ name, quantity: line.quantity, price: (line.amount_total / line.quantity / 100).toFixed(2) }];
  }
  return [{ name, quantity: 1, price: ((session.amount_total || 0) / 100).toFixed(2) }];
}

// Only identifiers come from the client at checkout; extra fields such as
// price, shipping or tax are stripped and recomputed server-side.
const checkoutRequestSchema = z.object({
  productId: z.string().regex(/^\d{1,20}$/),
  variantId: z.string().regex(/^\d{1,20}$/),
  quantity: z.number().int().min(1).max(10).default(1),
  // Only US ZIPs get a live estimate; anything else uses the default estimate
  zipCode: z.string().max(10).optional()
    // eslint-disable-next-line security/detect-unsafe-regex -- bounded by max(10), no nested quantifiers
    .transform(zip => (zip && /^\d{5}(?:-\d{4})?$/.test(zip.trim()) ? zip.trim() : undefined)),
});

export function registerRoutes(app: Express): Server {
  // Apply API rate limiting to all /api routes
  app.use("/api", apiLimiter);

  // Health check endpoints (for Kubernetes, Docker, monitoring)
  registerHealthRoutes(app);
  
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  
  // Login endpoint
  app.post("/api/auth/login", authLimiter, loginAccountLimiter, async (req, res) => {
    try {
      // Sessions are disabled when SESSION_SECRET is missing in production
      // (see server/app.ts). Fail before checking the password so a login
      // attempt can't be used to test credentials.
      if (!req.session) {
        return res.status(503).json({
          error: 'Login unavailable',
          message: 'Sign-in is not configured on this server',
        });
      }

      // Validate request body
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        logSecurityEvent('INVALID_LOGIN_REQUEST', {
          ip: req.ip,
          errors: result.error.issues,
        });
        
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'Please provide valid email and password',
        });
      }

      // Authenticate user
      const user = await authenticateUser(result.data, req);

      if (!user) {
        // Security: Don't reveal if email exists
        logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
          ip: req.ip,
          email: result.data.email,
        });

        return res.status(401).json({ 
          error: 'Authentication failed',
          message: 'Invalid email or password',
        });
      }

      // Security: Regenerate session ID to prevent fixation attacks, then
      // store the user in the new session
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          console.error('Session regenerate error:', regenerateErr);
          return res.status(500).json({
            error: SERVER_ERROR,
            message: 'Failed to create session',
          });
        }

        req.session.user = user;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({
              error: SERVER_ERROR,
              message: 'Failed to create session',
            });
          }

          safeLog.info(`User logged in: ${maskEmail(user.email)} (${user.role})`);

          res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
          });
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: SERVER_ERROR,
        message: 'An error occurred during login',
      });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // No session middleware or no session yet: nothing to log out of
      if (!req.session) {
        return res.json({ success: true });
      }

      const user = req.session.user;
      const userEmail = user?.email;
      const userId = user?.id;

      // Audit: Log logout before destroying session
      if (user) {
        await AuditService.logAuth(
          AuditAction.LOGOUT,
          "success",
          req,
          userEmail,
          userId
        );
      }

      req.session.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({
            error: SERVER_ERROR,
            message: 'Failed to logout',
          });
        }

        if (userEmail) {
          safeLog.info(`User logged out: ${maskEmail(userEmail)}`);
        }

        res.json({ success: true });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: SERVER_ERROR,
        message: 'Failed to logout',
      });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", optionalAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        user: null,
      });
    }

    // Refresh user data from database
    let currentUser;
    try {
      currentUser = await getUserById(req.user.id);
    } catch (error) {
      console.error('Error loading current user:', error);
      return res.status(500).json({ error: SERVER_ERROR, user: null });
    }

    if (!currentUser || currentUser.isActive !== 1) {
      req.session.destroy(() => {});
      return res.status(401).json({
        error: 'Session invalid',
        user: null,
      });
    }

    res.json({ 
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
    });
  });

  // ============================================
  // ADMIN ROUTES (Protected)
  // ============================================
  
  // All /api/admin routes require admin role
  app.use("/api/admin", requireAdmin);

  // Admin dashboard stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: DATABASE_NOT_AVAILABLE_ERROR });
      }

      // Get order statistics
      const allOrders = await db.select().from(orders);
      
      const stats = {
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((o: typeof allOrders[0]) => o.status === 'pending').length,
        failedOrders: allOrders.filter((o: typeof allOrders[0]) => o.status === 'failed').length,
        revenue: allOrders
          .filter((o: typeof allOrders[0]) => o.status === 'completed')
          .reduce((sum: number, o: typeof allOrders[0]) => sum + parseFloat(o.totalAmount), 0) * 100, // Convert to cents
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Get analytics data - REMOVED DUPLICATE (kept better implementation at line 463)

  // Get all orders (with pagination and filtering)
  app.get("/api/admin/orders", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: DATABASE_NOT_AVAILABLE_ERROR });
      }

      const parsedQuery = adminOrdersQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
      }
      const { status, limit: limitNum, offset: offsetNum } = parsedQuery.data;

      let query = db.select().from(orders);

      // Filter by status if provided
      if (status) {
        query = query.where(eq(orders.status, status));
      }

      const results = await query
        .orderBy(desc(orders.createdAt))
        .limit(limitNum)
        .offset(offsetNum);

      res.json({ orders: results });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Get single order with items and events
  app.get("/api/admin/orders/:id", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: DATABASE_NOT_AVAILABLE_ERROR });
      }

      const { id } = req.params;
      const user = req.user;

      // Order IDs are UUIDs; anything else would only produce a database error
      if (!z.string().uuid().safeParse(id).success) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Audit: Log PII access (order contains customer email and address)
      if (user) {
        await AuditService.logDataAccess(
          "order",
          order.id,
          user.id,
          user.email,
          req
        );
      }

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
      const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(desc(orderEvents.createdAt));

      res.json({ order, items, events });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // Admin Audit Logs - GDPR & Compliance
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: DATABASE_NOT_AVAILABLE_ERROR });
      }

      const parsedQuery = adminAuditLogsQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
      }
      const {
        category,
        severity,
        action,
        userId,
        startDate,
        endDate,
        limit: limitNum,
        page: pageNum,
      } = parsedQuery.data;

      const user = req.user;

      // Audit: Log admin accessing audit logs (meta!)
      if (user) {
        await AuditService.log({
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          action: "audit_logs_access",
          resource: "audit_logs",
          category: "data_access",
          severity: "info",
          status: "success",
          metadata: { filters: { category, severity, action, userId } },
          req,
        });
      }

      const offset = (pageNum - 1) * limitNum;

      // Build query dynamically based on filters
      const { auditLogs } = await import("../shared/schema");
      const { and, eq: eqOp, gte: gteOp, lte: lteOp } = await import("drizzle-orm");
      
      const conditions = [];
      
      if (category) {conditions.push(eqOp(auditLogs.category, category));}
      if (severity) {conditions.push(eqOp(auditLogs.severity, severity));}
      if (action) {conditions.push(eqOp(auditLogs.action, action));}
      if (userId) {conditions.push(eqOp(auditLogs.userId, userId));}
      if (startDate) {conditions.push(gteOp(auditLogs.createdAt, startDate));}
      if (endDate) {conditions.push(lteOp(auditLogs.createdAt, endDate));}

      const logs = await db.select().from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limitNum)
        .offset(offset);

      res.json({ 
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          hasMore: logs.length === limitNum,
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // Admin Analytics Dashboard
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: DATABASE_NOT_AVAILABLE_ERROR });
      }

      const { range = '30d' } = req.query;
      
      // Calculate date range
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[range as string] || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Fetch orders in range
      const recentOrders = await db
        .select()
        .from(orders)
        .where(gte(orders.createdAt, startDate))
        .orderBy(desc(orders.createdAt));

      // Calculate daily revenue
      // Map (not a plain object) so keying by app-derived strings never risks
      // prototype-pollution-style property injection.
      const dailyRevenueMap = new Map<string, { date: string; revenue: number; orders: number }>();

      recentOrders.forEach((order: typeof recentOrders[0]) => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        const entry = dailyRevenueMap.get(date) ?? { date, revenue: 0, orders: 0 };
        if (order.status === 'completed' || order.status === 'processing') {
          entry.revenue += parseFloat(order.totalAmount);
        }
        entry.orders += 1;
        dailyRevenueMap.set(date, entry);
      });

      // Get top products
      const allOrderItems = await db
        .select()
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(gte(orders.createdAt, startDate));

      const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();

      allOrderItems.forEach(({ order_items: item, orders: order }: typeof allOrderItems[0]) => {
        if (order.status === 'completed' || order.status === 'processing') {
          const productName = item.name;
          const stats = productStats.get(productName) ?? { name: productName, quantity: 0, revenue: 0 };
          stats.quantity += item.quantity;
          stats.revenue += parseFloat(item.price) * item.quantity;
          productStats.set(productName, stats);
        }
      });

      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Orders by status
      const statusCounts: Record<string, number> = {};
      recentOrders.forEach((order: typeof recentOrders[0]) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Calculate metrics
      const completedOrders = recentOrders.filter((o: typeof recentOrders[0]) => o.status === 'completed' || o.status === 'processing');
      const totalRevenue = completedOrders.reduce((sum: number, o: typeof completedOrders[0]) => sum + parseFloat(o.totalAmount), 0);
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      
      // Mock conversion rate (would need GA4 integration for real data)
      const conversionRate = 2.5;

      // Security events from audit logs
      const failedLoginEvents = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'login_failed'))
        .orderBy(desc(auditLogs.createdAt))
        .limit(5);

      const suspiciousEvents = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.severity, 'high'))
        .orderBy(desc(auditLogs.createdAt))
        .limit(5);

      const securityEvents = {
        failedLogins: failedLoginEvents.length,
        suspiciousActivities: suspiciousEvents.length,
        failedLoginDetails: failedLoginEvents.map((log: typeof failedLoginEvents[0]) => ({
          timestamp: log.createdAt,
          ip: log.ipAddress || 'Unknown',
          email: log.userEmail || 'Unknown',
          reason: log.errorMessage || 'Authentication failed',
        })),
        suspiciousActivityDetails: suspiciousEvents.map((log: typeof suspiciousEvents[0]) => ({
          timestamp: log.createdAt,
          ip: log.ipAddress || 'Unknown',
          action: log.action,
          details: log.resource || log.action,
        })),
      };

      res.json({
        dailyRevenue: Array.from(dailyRevenueMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
        topProducts,
        ordersByStatus,
        metrics: {
          totalRevenue,
          avgOrderValue,
          totalOrders: recentOrders.length,
          conversionRate,
        },
        securityEvents,
      });
    } catch (error) {
      console.error('[ERROR] Analytics endpoint failed:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // ============================================
  // CUSTOMER ORDER TRACKING (Public - with strict validation)
  // ============================================
  
  // Security: Public order tracking - requires email + order ID match
  // Privacy: Rate limited, no PII exposure, noindex
  app.get("/api/orders/track", async (req, res) => {
    try {
      const { email, orderId } = req.query;

      // Validation
      if (!email || !orderId || typeof email !== 'string' || typeof orderId !== 'string') {
        logSecurityEvent('INVALID_ORDER_TRACKING_REQUEST', {
          ip: req.ip,
          hasEmail: !!email,
          hasOrderId: !!orderId,
        });
        return res.status(400).json({ error: 'Email and Order ID required' });
      }

      if (!db) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }

      // Security: Find order by stripe session ID and verify email matches
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.stripeSessionId, orderId))
        .limit(1);

      if (!order || order.customerEmail.toLowerCase() !== email.toLowerCase().trim()) {
        // Security: Generic error message (don't reveal if order exists)
        logSecurityEvent('FAILED_ORDER_TRACKING', {
          ip: req.ip,
          email: email.toLowerCase().trim(),
          orderId: orderId.slice(0, 8),
        });
        return res.status(404).json({ error: 'Order not found' });
      }

      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      // Security: Return limited information (no payment details, no internal IDs)
      res.json({
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          currency: order.currency,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          shippingAddress: order.shippingAddress,
          printfulOrderId: order.printfulOrderId, // For tracking
          createdAt: order.createdAt,
        },
        items: items.map((item: typeof items[0]) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
        })),
      });

      logSecurityEvent('SUCCESSFUL_ORDER_TRACKING', {
        ip: req.ip,
        orderId: orderId.slice(0, 8),
      });
    } catch (error) {
      console.error('Error tracking order:', error);
      res.status(500).json({ error: 'Unable to track order' });
    }
  });

  
  // Metrics endpoint
  // Per-endpoint latency, error and cache stats - admin only
  app.get("/api/metrics", requireAdmin, (req, res) => {
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

      const videos = await getPlaylistVideos(playlistId, validation.value);
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

      // Only the site's own channel(s): each uncached lookup spends YouTube quota
      if (!isAllowedChannel(channelId)) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // A03: Validate maxResults parameter
      const maxResultsInput = req.query.maxResults as string;
      const validation = validateNumber(maxResultsInput || '50', 1, 10000);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const videos = await getChannelVideos(channelId, Math.min(validation.value, MAX_CHANNEL_RESULTS));
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

      // Only the site's own channel(s): each uncached lookup spends YouTube quota
      if (!isAllowedChannel(channelId)) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // A03: Validate maxResults parameter
      const maxResultsInput = req.query.maxResults as string;
      const validation = validateNumber(maxResultsInput || '50', 1, 10000);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const shorts = await getChannelShorts(channelId, validation.value);
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

      // Only the site's own channel(s): each uncached lookup spends YouTube quota
      if (!isAllowedChannel(channelId)) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      const stats = await getChannelStats(channelId);
      if (!stats) {
        return res.status(503).json({ 
          error: 'YouTube API not configured',
          message: 'YouTube features are currently unavailable' 
        });
      }
      res.json(stats);
    } catch (error) {
      console.error('Error fetching YouTube channel stats:', error);
      res.status(500).json({ error: 'Failed to fetch channel statistics' });
    }
  });

  // The feed URL is pinned server-side. getPodcastFeed() writes one shared
  // cache file that every visitor is served (and that the audio proxy trusts
  // via findCachedEpisodeAudioUrl), so a caller-supplied URL must never be
  // fetched. PODCAST_FEED_URL wins; VITE_PODCAST_FEED_URL is the fallback
  // because existing deployments already set it for the client build.
  function getConfiguredPodcastFeedUrl(): string | undefined {
    const configured = (process.env.PODCAST_FEED_URL || process.env.VITE_PODCAST_FEED_URL || '').trim();
    return configured || undefined;
  }

  function normalizeFeedUrl(urlStr: string): string {
    try {
      return new URL(urlStr).href;
    } catch {
      return urlStr;
    }
  }

  // feedUrl is optional and only accepted when it matches the pinned URL, so
  // clients built before the body field was dropped keep working.
  // limit upper bound must stay >= the limit client/src/pages/Podcast.tsx
  // requests for its full-archive list, or that page 400s. The feed is ~151
  // episodes today; 200 leaves headroom without letting an arbitrary caller
  // ask us to parse an unbounded feed.
  const podcastFeedRequestSchema = z.object({
    feedUrl: z.string().max(2048).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  });

  // Rate limited by the global apiLimiter plus strictLimiter on /api/podcast/
  // (server/security.ts). Not expensiveLimiter: that allows 10 requests/hour
  // per IP, and both the home page and /podcast call this route on every
  // load. With the URL pinned, a request costs at most one upstream fetch
  // per podcast.ts cache period, whoever sends it.
  app.post("/api/podcast/feed", async (req, res) => {
    try {
      const parsed = podcastFeedRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        logSecurityEvent('INVALID_PODCAST_FEED_REQUEST', {
          ip: req.ip,
          errors: parsed.error.issues,
        });
        return res.status(400).json({ success: false, error: 'Invalid request' });
      }

      const feedUrl = getConfiguredPodcastFeedUrl();
      if (!feedUrl) {
        return res.status(503).json({ success: false, error: 'Podcast feed not configured' });
      }

      const requestedFeedUrl = parsed.data.feedUrl;
      if (requestedFeedUrl !== undefined && normalizeFeedUrl(requestedFeedUrl) !== normalizeFeedUrl(feedUrl)) {
        logSecurityEvent('PODCAST_FEED_URL_MISMATCH', {
          feedUrl: requestedFeedUrl.slice(0, 200),
          ip: req.ip,
        });
        return res.status(400).json({ success: false, error: 'feedUrl does not match the configured podcast feed' });
      }

      // A10: Defense in depth - the configured URL still goes through the SSRF check
      const urlValidation = validateUrl(feedUrl);
      if (!urlValidation.valid) {
        logSecurityEvent('PODCAST_FEED_CONFIG_INVALID', {
          ip: req.ip,
          error: urlValidation.error,
        });
        return res.status(503).json({ success: false, error: 'Podcast feed not configured' });
      }

      const episodes = await getPodcastFeed(feedUrl, parsed.data.limit ?? 10);
      // Bare array (not { success, data }) because PodcastSection and the
      // /podcast page consume this response shape directly.
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      logSecurityEvent('PODCAST_FEED_FETCH_FAILED', { ip: req.ip });
      res.status(500).json({ success: false, error: 'Failed to fetch podcast feed' });
    }
  });

  // Anchor (Spotify for Creators) episode URLs redirect to this distribution.
  const ANCHOR_AUDIO_CLOUDFRONT_HOST = 'd3ctxlq1ktw2nl.cloudfront.net';

  // Shared by the redirect-hop checks in the audio proxy below.
  function isAllowedAudioDomain(hostname: string, allowedDomains: string[]): boolean {
    // Match the domain itself or a true subdomain of it. A bare endsWith()
    // would also accept look-alikes such as "evilapple.com" for "apple.com".
    const host = hostname.toLowerCase();
    return allowedDomains.some(domain => host === domain || host.endsWith(`.${domain}`));
  }

  // Runs the SSRF + domain-allowlist check shared by the audio proxy below
  // for the original URL and every redirect hop it follows.
  function checkAudioUrlSafety(
    urlStr: string,
    allowedDomains: string[],
    eventNames: { invalidUrl: string; unauthorizedDomain: string },
    context: Record<string, unknown>
  ): { ok: true } | { ok: false; status: number; error: string } {
    const validation = validateUrl(urlStr);
    if (!validation.valid) {
      logSecurityEvent(eventNames.invalidUrl, { ...context, error: validation.error });
      return { ok: false, status: 400, error: validation.error || 'Invalid URL' };
    }

    const hostname = new URL(urlStr).hostname;
    if (!isAllowedAudioDomain(hostname, allowedDomains)) {
      logSecurityEvent(eventNames.unauthorizedDomain, context);
      return { ok: false, status: 403, error: 'Audio URL from unauthorized domain' };
    }

    return { ok: true };
  }

  // Follows redirects from startUrl to the final audio URL. Redirects are
  // followed manually so every hop is validated *before* the server requests
  // it; `redirect: 'follow'` would let an allowed host bounce the server to
  // an internal address before we ever saw the final URL. On a network error
  // or timeout it returns the last validated URL and leaves any remaining
  // redirects to the browser.
  async function resolveAudioRedirects(
    startUrl: string,
    allowedDomains: string[],
    context: { originalUrl: string; ip: string | undefined }
  ): Promise<{ ok: true; url: string } | { ok: false; status: number; error: string }> {
    const MAX_REDIRECTS = 5;
    const controller = new globalThis.AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 15000);
    let currentUrl = startUrl;

    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          redirect: 'manual',
          signal: controller.signal,
        });

        const location = response.headers.get('location');
        if (response.status < 300 || response.status >= 400 || !location) {
          break;
        }

        const nextUrl = new URL(location, currentUrl).toString();
        const hopCheck = checkAudioUrlSafety(
          nextUrl,
          allowedDomains,
          { invalidUrl: 'SSRF_ATTEMPT_FINAL_URL', unauthorizedDomain: 'UNAUTHORIZED_AUDIO_DOMAIN_FINAL' },
          { ...context, finalUrl: nextUrl }
        );
        if (!hopCheck.ok) {
          return hopCheck;
        }
        currentUrl = nextUrl;
      }
    } catch {
      // Fall through with the last validated URL.
    } finally {
      globalThis.clearTimeout(timeout);
    }

    return { ok: true, url: currentUrl };
  }

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

      // Only allow audio from known podcast hosting domains. CloudFront is
      // pinned to Anchor's audio distribution: any AWS customer can serve
      // content from a *.cloudfront.net host, so the bare domain is too broad.
      const allowedDomains = ['anchor.fm', ANCHOR_AUDIO_CLOUDFRONT_HOST, 'spotify.com', 'apple.com', 'spreaker.com', 'buzzsprout.com', 'libsyn.com', 'podbean.com', 'simplecast.com', 'transistor.fm', 'captivate.fm', 'megaphone.fm', 'omny.fm', 'acast.com'];

      // Validate URL (SSRF) and confirm it's on an allowed audio domain
      const urlCheck = checkAudioUrlSafety(
        decodedUrl,
        allowedDomains,
        { invalidUrl: 'SSRF_ATTEMPT', unauthorizedDomain: 'UNAUTHORIZED_AUDIO_DOMAIN' },
        { url: decodedUrl, ip: req.ip }
      );
      if (!urlCheck.ok) {
        return res.status(urlCheck.status).json({ error: urlCheck.error });
      }

      // Only proxy episodes that are in the server-pinned podcast feed, and
      // use the feed's copy of the URL rather than the query string from here on.
      const episodeAudioUrl = await findCachedEpisodeAudioUrl(decodedUrl);
      if (!episodeAudioUrl) {
        logSecurityEvent('AUDIO_PROXY_UNKNOWN_EPISODE', { url: decodedUrl, ip: req.ip });
        return res.status(404).json({ error: 'Audio URL is not a known podcast episode' });
      }

      const resolved = await resolveAudioRedirects(episodeAudioUrl, allowedDomains, { originalUrl: decodedUrl, ip: req.ip });
      if (!resolved.ok) {
        return res.status(resolved.status).json({ error: resolved.error });
      }

      // resolved.url is either the feed's episode URL or a hop that passed
      // the same SSRF + allowlist check.
      res.redirect(302, resolved.url);
    } catch (error) {
      console.error('Error proxying audio:', error instanceof Error ? error.message : error);
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

      if (!isAllowedShop(shopId)) {
        return res.status(404).json({ error: 'Shop not found' });
      }

      // A03: Validate limit parameter
      const limitInput = req.query.limit as string;
      const validation = validateNumber(limitInput || '8', 1, MAX_SHOP_LISTINGS);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const products = await getShopListings(shopId, validation.value);
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
      
      const products = await getPrintfulSyncProducts(validation.value);
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
      // Validate inputs
      if (!req.body?.variantId || !req.body?.zipCode) {
        return res.status(400).json({ error: 'Missing required fields: variantId, zipCode' });
      }

      // Basic zip code validation (US/CA)
      const rawZip = req.body.zipCode;
      if (typeof rawZip !== 'string' || rawZip.trim().length < 5 || rawZip.trim().length > 10) {
        return res.status(400).json({ error: 'Invalid zip/postal code format' });
      }

      const parsed = singleShippingEstimateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid shipping estimate request' });
      }
      const { variantId, zipCode, quantity } = parsed.data;

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
          quantity,
        }],
      });

      if (!estimate) {
        return res.status(500).json({ error: 'Failed to calculate shipping estimate' });
      }

      // Calculate total
      const basePrice = parseFloat(String(parsed.data.basePrice ?? '0')) || 0;
      const subtotal = basePrice * quantity;
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
      const { recipient: rawRecipient } = req.body ?? {};

      // Validate inputs - support both single item (legacy) and multi-item (cart)
      if (!rawRecipient) {
        return res.status(400).json({ error: 'Missing required field: recipient' });
      }

      if (!rawRecipient.address1 || !rawRecipient.city || !rawRecipient.state_code || !rawRecipient.country_code || !rawRecipient.zip) {
        return res.status(400).json({ error: 'Missing required recipient fields' });
      }

      const parsed = legacyShippingEstimateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid shipping estimate request' });
      }
      const { variantId, quantity, recipient, items } = parsed.data;

      // Build items array - support both formats
      let itemsToEstimate;
      if (items && items.length > 0) {
        // Multi-item cart format
        itemsToEstimate = items.map(item => ({
          sync_variant_id: parseInt(item.variantId),
          quantity: item.quantity,
        }));
      } else if (variantId) {
        // Single item format (legacy)
        itemsToEstimate = [{
          sync_variant_id: parseInt(variantId),
          quantity,
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
      // Validate inputs
      if (!Array.isArray(req.body?.items) || req.body.items.length === 0) {
        return res.status(400).json({ error: 'Missing required field: items' });
      }

      // eslint-disable-next-line security/detect-unsafe-regex
      if (typeof req.body.zipCode !== 'string' || !/^\d{5}(?:-\d{4})?$/.test(req.body.zipCode)) {
        return res.status(400).json({ error: 'Invalid zip code format' });
      }

      const parsed = cartShippingEstimateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid shipping estimate request' });
      }
      const { items, zipCode } = parsed.data;

      // Convert items to Printful format
      const itemsToEstimate = items.map(item => ({
        sync_variant_id: parseInt(item.variantId),
        quantity: item.quantity,
      }));

      // Use a default US address with the provided zip code
      // Printful only needs zip code for US domestic shipping estimates
      const estimate = await getPrintfulShippingEstimate({
        recipient: {
          address1: '123 Main St', // Placeholder - not used for rate calculation
          address2: null,
          city: 'Any City', // Placeholder - not used for rate calculation
          state_code: 'NY', // Placeholder US state; Printful rejects the country code 'US' here
          country_code: 'US',
          zip: zipCode.slice(0, 5), // Use only 5-digit zip
        },
        items: itemsToEstimate,
      });

      if (!estimate) {
        return res.status(500).json({ error: 'Failed to calculate shipping estimate' });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + ((item.basePrice ?? 0) * item.quantity), 0);
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
      // Price, name, image, shipping and tax are never taken from the client:
      // they are looked up server-side so a crafted request can't set its own price.
      const parsed = checkoutRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        logSecurityEvent('CHECKOUT_INVALID_INPUT', {
          ip: req.ip,
          issues: parsed.error.issues.map(i => i.path.join('.')),
        });
        return res.status(400).json({ error: 'Invalid checkout request' });
      }
      const { productId, variantId, quantity, zipCode } = parsed.data;

      const variant = await getSyncVariantForCheckout(productId, variantId);
      if (!variant) {
        logSecurityEvent('CHECKOUT_UNKNOWN_VARIANT', { ip: req.ip, productId, variantId });
        return res.status(400).json({ error: 'Product is not available' });
      }

      // Recompute Printful's shipping estimate server-side when a zip is given;
      // otherwise createCheckoutSession falls back to its default estimate.
      let shippingEstimate: { shipping: number; tax: number } | undefined;
      if (zipCode) {
        const estimate = await getPrintfulShippingEstimate({
          recipient: {
            address1: '123 Main St', // Placeholder - not used for rate calculation
            address2: null,
            city: 'Any City', // Placeholder - not used for rate calculation
            // Must be a real US state code; Printful rejects 'US'. Same
            // placeholder as /api/printful/shipping/estimate.
            state_code: 'NY',
            country_code: 'US',
            zip: zipCode.slice(0, 5),
          },
          items: [{ sync_variant_id: parseInt(variantId), quantity }],
        });
        if (estimate && estimate.shipping >= 0 && estimate.tax >= 0) {
          shippingEstimate = { shipping: estimate.shipping, tax: estimate.tax };
        }
      }

      const session = await createCheckoutSession({
        productId,
        variantId,
        productName: `${variant.productName} - ${variant.variantName}`,
        price: variant.retailPriceCents,
        quantity,
        imageUrl: variant.image || undefined,
        shippingEstimate,
        metadata: {
          product_image_url: variant.image || '',
        },
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

      // The session ID sits in the success URL (browser history, Referer), so
      // anyone holding it gets this response: mask the customer's email
      const customerEmail = session.customer_details?.email;
      res.json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_email: customerEmail ? maskEmail(customerEmail) : undefined,
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

  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return res.status(400).send('Webhook signature verification failed');
    }

    try {
      // Use raw body for signature verification
      const rawBody = (req as any).rawBody || req.body;
      const event = verifyWebhookSignature(rawBody, signature as string, webhookSecret);

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
          safeLog.info('Customer email:', { email: eventSession.customer_details?.email });
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

          // Create order record in database. The unique stripe_session_id
          // makes this insert the idempotency lock: only the delivery that
          // creates the row goes on to fulfil, so a redelivered or concurrent
          // webhook can't ship the order twice.
          try {
            const orderData = {
              stripeSessionId: sessionId,
              stripePaymentIntentId: fullSession.payment_intent as string,
              customerEmail: fullSession.customer_details?.email || '',
              customerName: fullSession.customer_details?.name || undefined,
              totalAmount: ((fullSession.amount_total ?? 0) / 100).toFixed(2),
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
                imageUrl: fullSession.metadata?.product_image_url || undefined,
              })) || [],
              metadata: fullSession.metadata || undefined,
            };

            const order = await createOrder(orderData);
            console.log(`✅ Order created in database: ${order.id}`);
          } catch (dbError) {
            if (isUniqueViolation(dbError)) {
              console.log(`⚠️  Order for session ${sessionId} already exists, skipping duplicate webhook`);
              processedSessions.add(sessionId);
              return res.json({ received: true, duplicate: true });
            }
            // Any other DB failure: still fulfil (the customer has paid) and alert
            console.error('❌ Failed to create order in database:', dbError);
            await sendAdminAlert(
              'Database Error: Failed to create order',
              `Error creating order for session ${sessionId}`,
              { sessionId, error: String(dbError) }
            );
          }

          // Delayed payment methods complete the session before the money
          // arrives; those are fulfilled on async_payment_succeeded instead
          if (fullSession.payment_status !== 'paid') {
            console.log(`⏳ Session ${sessionId} not paid yet (${fullSession.payment_status}); waiting for async payment`);
            break;
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
            // Recipient name, address and email stay out of the logs
            console.log('Recipient country:', orderData.recipient.country_code);
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
                  await updateOrderWithPrintfulId(order.id, String(result.orderId));
                  
                  // Send confirmation email to customer
                  const items = confirmationEmailItems(fullSession);
                  
                  await sendOrderConfirmation(order, items);
                  safeLog.info(`✅ Order confirmation email sent to ${maskEmail(order.customerEmail)}`);
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
              console.error('Order items:', JSON.stringify(orderData.items));
              
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

          // Idempotency: skip if this session was already sent to Printful
          const existingOrder = await getOrderByStripeSessionId(asyncEventSession.id);
          if (processedSessions.has(asyncEventSession.id) || existingOrder?.printfulOrderId) {
            console.log(`⚠️  Session ${asyncEventSession.id} already fulfilled, skipping duplicate webhook`);
            return res.json({ received: true, duplicate: true });
          }
          processedSessions.add(asyncEventSession.id);

          const asyncSession = await getCheckoutSession(asyncEventSession.id);

          if (asyncSession) {
            const asyncOrderData = createPrintfulOrderFromSession(asyncSession);
            if (asyncOrderData) {
              const result = await createPrintfulOrder(asyncOrderData);
              
              if (result.success) {
                const order = await getOrderByStripeSessionId(asyncEventSession.id);
                if (order) {
                  await updateOrderWithPrintfulId(order.id, String(result.orderId));
                  
                  const items = confirmationEmailItems(asyncSession);
                  
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

  // ============================================
  // PRINTFUL WEBHOOKS
  // ============================================
  
  /**
   * Printful Webhook Handler
   * Handles order status updates from Printful:
   * - package_shipped: Order has been shipped
   * - package_returned: Order was returned
   * - order_failed: Order failed to fulfill
   * - order_canceled: Order was cancelled
   * 
   * Security: Uses HMAC signature verification
   * Documentation: https://developers.printful.com/docs/#tag/Webhooks
   */
  // Printful webhook handler - receives notifications from Printful
  app.post("/api/webhooks/printful", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['x-printful-signature'];
      const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
      // configureApp (server/app.ts) mounts express.raw for this path, so the body is a Buffer
      const rawBody = (req as any).rawBody || req.body;

      if (webhookSecret) {
        if (typeof signature !== 'string' || signature.length === 0) {
          logSecurityEvent('PRINTFUL_WEBHOOK_MISSING_SIGNATURE', {});
          return res.status(401).json({ error: 'Missing signature' });
        }

        // The HMAC must be computed over the exact bytes Printful sent. A body
        // that was already parsed into an object can't be verified, so fail closed.
        if (!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') {
          logSecurityEvent('PRINTFUL_WEBHOOK_RAW_BODY_UNAVAILABLE', {});
          return res.status(500).json({ error: 'Webhook verification unavailable' });
        }

        const digest = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
        const expected = Buffer.from(digest, 'utf8');
        const received = Buffer.from(signature, 'utf8');

        if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
          logSecurityEvent('PRINTFUL_WEBHOOK_INVALID_SIGNATURE', {
            receivedSignature: `${signature.substring(0, 10)}...`,
          });
          return res.status(401).json({ error: 'Invalid signature' });
        }
      } else if (process.env.NODE_ENV === 'production') {
        // Never accept unsigned webhooks in production
        logSecurityEvent('PRINTFUL_WEBHOOK_SECRET_NOT_CONFIGURED', {});
        return res.status(503).json({ error: 'Webhook not configured' });
      }
      // No secret outside production: allow unsigned webhooks (dev mode)

      // Parse the webhook payload
      let payload;
      if (Buffer.isBuffer(rawBody)) {
        payload = JSON.parse(rawBody.toString());
      } else if (typeof rawBody === 'string') {
        payload = JSON.parse(rawBody);
      } else {
        // Already parsed as JSON object
        payload = rawBody;
      }
      const { type, data } = payload;

      console.log('[Printful Webhook] Event received:', type);
      // The payload carries the recipient's name and address; log the order id only
      console.log('[Printful Webhook] Order:', data?.order?.id ?? data?.id);

      // Validate required fields
      if (!data) {
        console.error('❌ Missing data field in webhook payload');
        return res.status(400).json({ error: 'Missing data field' });
      }

      // Find the order by Printful order ID
      const printfulOrderId = data.order?.id || data.id;
      if (!printfulOrderId) {
        console.error('❌ No Printful order ID in webhook payload');
        return res.status(400).json({ error: 'Missing order ID' });
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.printfulOrderId, String(printfulOrderId)))
        .limit(1);

      if (!order) {
        console.warn(`⚠️  Order not found for Printful ID: ${printfulOrderId}`);
        // Still return 200 to acknowledge receipt (might be a test webhook)
        return res.json({ received: true, warning: 'Order not found' });
      }

      console.log(`📦 Processing webhook for order ${order.id}`);

      // Handle different webhook events
      switch (type) {
        case 'package_shipped': {
          console.log('✅ Package shipped for order:', order.id);
          
          // Extract shipping information
          const shipment = data.shipment || {};
          const trackingNumber = shipment.tracking_number;
          const trackingUrl = shipment.tracking_url;
          const carrier = shipment.carrier;
          const service = shipment.service;
          
          // Update order status and add tracking info
          const updatedMetadata = {
            ...(order.metadata as object || {}),
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            carrier: carrier,
            service: service,
            shipped_at: new Date().toISOString(),
          };

          await db
            .update(orders)
            .set({
              status: 'shipped',
              metadata: updatedMetadata,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          // Log event
          await db.insert(orderEvents).values({
            orderId: order.id,
            eventType: 'shipped',
            status: 'success',
            message: `Package shipped via ${carrier} ${service}`,
            metadata: {
              tracking_number: trackingNumber,
              tracking_url: trackingUrl,
              carrier: carrier,
            },
          });

          console.log(`📬 Order ${order.id} marked as shipped. Tracking: ${trackingNumber}`);

          // TODO: Send shipping notification email to customer
          // await sendShippingNotification(order, trackingNumber, trackingUrl);

          break;
        }

        case 'package_returned': {
          console.log('⚠️  Package returned for order:', order.id);
          
          await db
            .update(orders)
            .set({
              status: 'returned',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          await db.insert(orderEvents).values({
            orderId: order.id,
            eventType: 'returned',
            status: 'success',
            message: 'Package was returned',
            metadata: data,
          });

          // Alert admin about returned package
          await sendAdminAlert(
            'Package Returned',
            `Order ${order.id} has been returned\n\nCustomer: ${order.customerEmail}`,
            { orderId: order.id, printfulOrderId }
          );

          break;
        }

        case 'order_failed': {
          console.error('❌ Order failed:', order.id);
          
          const reason = data.reason || 'Unknown reason';
          
          await db
            .update(orders)
            .set({
              status: 'failed',
              metadata: {
                ...(order.metadata as object || {}),
                failure_reason: reason,
                failed_at: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          await db.insert(orderEvents).values({
            orderId: order.id,
            eventType: 'failed',
            status: 'failed',
            message: `Order failed: ${reason}`,
            metadata: data,
          });

          // Alert admin about failed order
          await sendAdminAlert(
            'Order Failed',
            `Order ${order.id} failed to fulfill\n\nReason: ${reason}\nCustomer: ${order.customerEmail}`,
            { orderId: order.id, printfulOrderId, reason }
          );

          break;
        }

        case 'order_canceled': {
          console.log('🚫 Order canceled:', order.id);
          
          await db
            .update(orders)
            .set({
              status: 'cancelled',
              metadata: {
                ...(order.metadata as object || {}),
                canceled_at: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          await db.insert(orderEvents).values({
            orderId: order.id,
            eventType: 'cancelled',
            status: 'success',
            message: 'Order was cancelled',
            metadata: data,
          });

          break;
        }

        default:
          console.log(`ℹ️  Unhandled Printful webhook type: ${type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Printful webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
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

      // Avatars are small; refuse anything large rather than buffer it in memory
      const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
      const declaredLength = Number(response.headers.get('content-length') ?? 0);
      if (declaredLength > MAX_AVATAR_BYTES) {
        return res.status(502).json({ error: 'Avatar too large' });
      }

      // Get the image buffer
      const imageBuffer = await response.arrayBuffer();
      if (imageBuffer.byteLength > MAX_AVATAR_BYTES) {
        return res.status(502).json({ error: 'Avatar too large' });
      }

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
  app.post("/api/contact/sponsor", (req, res) => {
    try {
      const parsed = sponsorInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        const emailInvalid = parsed.error.issues.some(issue => issue.path[0] === 'email')
          && typeof req.body?.email === 'string' && req.body.email.length > 0;
        return res.status(400).json({
          error: emailInvalid ? 'Invalid email format' : 'Name, email, and message are required',
        });
      }
      const { name, email, company, interest, message } = parsed.data;

      // Log the sponsorship inquiry
      safeLog.info('📧 Sponsorship Inquiry Received:', {
        email: maskEmail(email),
        company: company || 'N/A',
        interest: interest || 'N/A',
        timestamp: new Date().toISOString(),
      });

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // For now, we just log it. In production, you'd want to:
      // 1. Send email notification to sponsors@talesofaneria.com
      // 2. Store inquiry in database
      // 3. Send auto-reply to inquirer
      
      // Simulate email sending (replace with actual email service).
      // Every field is visitor-supplied, so it is HTML-escaped before it
      // goes into the template.
      const escapeHtml = (value: string) => validator.escape(value);
      const emailData = {
        to: 'sponsors@talesofaneria.com',
        from: 'noreply@talesofaneria.com',
        subject: `New Sponsorship Inquiry from ${(company || name).replace(/[\r\n]+/g, ' ')}`,
        html: `
          <h2>New Sponsorship Inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Company:</strong> ${company ? escapeHtml(company) : 'Not provided'}</p>
          <p><strong>Interest:</strong> ${interest ? escapeHtml(interest) : 'Not specified'}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      };

      safeLog.info('📧 Email would be sent:', { to: emailData.to, subject: emailData.subject });

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

  // Any /api request that didn't match a route above is a genuine 404 —
  // respond with JSON instead of falling through to the SPA's index.html.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return createServer(app);
}
