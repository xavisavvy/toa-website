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
    it('returns only status and timestamp publicly', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(Object.keys(response.body).sort()).toEqual(['status', 'timestamp']);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });
  });

  describe('GET /api/admin/health', () => {
    it('requires an admin session for the detailed report', async () => {
      const response = await request(app).get('/api/admin/health');

      expect(response.status).toBe(401);
      expect(response.body).not.toHaveProperty('checks');
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
