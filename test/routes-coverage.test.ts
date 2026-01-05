import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';

import { registerRoutes } from '../server/routes';

describe('Routes Coverage', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    );
    registerRoutes(app);
  });

  describe('Metrics Route', () => {
    it('should return metrics from /api/metrics', async () => {
      const response = await request(app).get('/api/metrics');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('YouTube Routes', () => {
    it('should reject invalid playlist ID format', async () => {
      const response = await request(app).get('/api/youtube/playlist/invalid@id!');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid playlist ID format');
    });

    it('should reject invalid channel ID format', async () => {
      const response = await request(app).get('/api/youtube/channel/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid channel ID');
    });

    it('should reject invalid channel ID for shorts', async () => {
      const response = await request(app).get('/api/youtube/channel/invalid-id/shorts');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid channel ID');
    });

    it('should reject invalid channel ID for stats', async () => {
      const response = await request(app).get('/api/youtube/channel/invalid-id/stats');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid channel ID');
    });
  });

  describe('Podcast Routes', () => {
    it('should require feedUrl for podcast feed', async () => {
      const response = await request(app).post('/api/podcast/feed').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('feedUrl is required');
    });

    it('should validate podcast feed URL', async () => {
      const response = await request(app)
        .post('/api/podcast/feed')
        .send({ feedUrl: 'invalid-url' });
      expect(response.status).toBe(400);
    });

    it('should require url parameter for audio proxy', async () => {
      const response = await request(app).get('/api/podcast/audio-proxy');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('URL parameter is required');
    });
  });

  describe('Etsy Routes', () => {
    it('should reject invalid shop ID format', async () => {
      const response = await request(app).get('/api/etsy/shop/invalid@shop/listings');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid shop ID format');
    });
  });

  describe('Printful Routes', () => {
    it('should reject invalid product ID format', async () => {
      const response = await request(app).get('/api/printful/products/abc');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid product ID format');
    });

    it('should require variantId and zipCode for shipping estimate', async () => {
      const response = await request(app).post('/api/printful/shipping/estimate').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should validate zip code length', async () => {
      const response = await request(app)
        .post('/api/printful/shipping/estimate')
        .send({ variantId: '123', zipCode: '1' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid zip/postal code format');
    });

    it('should require recipient for shipping estimate', async () => {
      const response = await request(app).post('/api/printful/shipping-estimate').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field: recipient');
    });

    it('should validate recipient fields', async () => {
      const response = await request(app)
        .post('/api/printful/shipping-estimate')
        .send({ recipient: { city: 'Test' } });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required recipient fields');
    });

    it('should require items for cart shipping estimate', async () => {
      const response = await request(app)
        .post('/api/printful/shipping/estimate-cart')
        .send({ zipCode: '12345' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required field: items');
    });

    it('should validate zip code for cart estimate', async () => {
      const response = await request(app)
        .post('/api/printful/shipping/estimate-cart')
        .send({ items: [{ variantId: '123', quantity: 1, basePrice: 10 }], zipCode: 'invalid' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid zip code format');
    });
  });

  describe('Stripe Routes', () => {
    it('should return stripe config', async () => {
      const response = await request(app).get('/api/stripe/config');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('publishableKey');
    });

    it('should require all fields for checkout session', async () => {
      const response = await request(app).post('/api/stripe/create-checkout').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should validate product and variant IDs', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout')
        .send({ productId: 'abc', variantId: 'xyz', productName: 'Test', price: '10.00' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid product or variant ID');
    });

    it('should validate session ID format', async () => {
      const response = await request(app).get('/api/stripe/checkout/invalid-session');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid session ID format');
    });

    it('should require stripe signature for webhook', async () => {
      const response = await request(app).post('/api/stripe/webhook').send({});
      expect(response.status).toBe(400);
    });
  });

  describe('D&D Beyond Routes', () => {
    it('should reject invalid character ID format', async () => {
      const response = await request(app).get('/api/dndbeyond/character/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid character ID format');
    });

    it('should reject invalid character ID for avatar', async () => {
      const response = await request(app).get('/api/dndbeyond/avatars/invalid-id/avatar.jpg');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid character ID format');
    });
  });

  describe('Order Tracking Routes', () => {
    it('should require email and orderId for tracking', async () => {
      const response = await request(app).get('/api/orders/track');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email and Order ID required');
    });

    it('should require email parameter', async () => {
      const response = await request(app).get('/api/orders/track?orderId=test123');
      expect(response.status).toBe(400);
    });

    it('should require orderId parameter', async () => {
      const response = await request(app).get('/api/orders/track?email=test@test.com');
      expect(response.status).toBe(400);
    });
  });

  describe('Sponsorship Contact Routes', () => {
    it('should require name, email, and message', async () => {
      const response = await request(app).post('/api/contact/sponsor').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/contact/sponsor')
        .send({ name: 'Test', email: 'invalid-email', message: 'Test message' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email format');
    });
  });

  describe('Printful Webhook Routes', () => {
    it('should handle printful webhook with missing signature', async () => {
      const response = await request(app)
        .post('/api/webhooks/printful')
        .send({ type: 'package_shipped', data: {} });
      expect([200, 400, 401]).toContain(response.status);
    });
  });
});
