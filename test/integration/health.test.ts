import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

import { registerRoutes } from '../../server/routes';

describe('Health Check Endpoints', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('GET /api/health', () => {
    it('returns comprehensive health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('checks');
    });

    it('includes all component checks', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body.checks).toHaveProperty('storage');
      expect(response.body.checks).toHaveProperty('cache');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks).toHaveProperty('disk');
      expect(response.body.checks).toHaveProperty('cpu');
    });

    it('each check has required fields', async () => {
      const response = await request(app).get('/api/health');
      
      Object.values(response.body.checks).forEach((check: any) => {
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(check).toHaveProperty('responseTime');
        expect(typeof check.responseTime).toBe('number');
      });
    });

    it('returns valid status values', async () => {
      const response = await request(app).get('/api/health');
      const validStatuses = ['healthy', 'degraded', 'unhealthy'];
      
      expect(validStatuses).toContain(response.body.status);
      Object.values(response.body.checks).forEach((check: any) => {
        expect(validStatuses).toContain(check.status);
      });
    });
  });

  describe('GET /api/ready', () => {
    it('returns readiness status', async () => {
      const response = await request(app).get('/api/ready');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ready');
      expect(response.body.ready).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/alive', () => {
    it('returns liveness status', async () => {
      const response = await request(app).get('/api/alive');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('alive');
      expect(response.body.alive).toBe(true);
      expect(response.body).toHaveProperty('uptime');
    });

    it('responds quickly', async () => {
      const start = Date.now();
      const response = await request(app).get('/api/alive');
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /api/startup', () => {
    it('returns startup status', async () => {
      const response = await request(app).get('/api/startup');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('started');
      expect(response.body.started).toBe(true);
    });
  });

  describe('Performance', () => {
    it('health endpoint responds in under 2 seconds', async () => {
      const start = Date.now();
      const response = await request(app).get('/api/health');
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });

    it('handles concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() => 
        request(app).get('/api/health')
      );
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        // Accept 200 (healthy) or 503 (unhealthy/degraded) during concurrent load
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('status');
      });
    });
  });
});
