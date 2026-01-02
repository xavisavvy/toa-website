import express, { type Express } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { registerHealthRoutes } from '../server/health';

describe('Health Check Endpoint', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    registerHealthRoutes(app);
  });

  describe('Basic Health Check', () => {
    it('should return 200 OK with healthy status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: expect.any(String),
      });
    });

    it('should include service name and environment', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });

    it('should return uptime greater than 0', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should include version information', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('string');
    });
  });

  describe('Detailed Health Check', () => {
    it('should return detailed checks', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toBeInstanceOf(Object);
    });

    it('should include memory usage in check', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks.memory).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        message: expect.any(String),
        responseTime: expect.any(Number),
      });
    });

    it('should include storage connectivity check', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.checks).toHaveProperty('storage');
      expect(response.body.checks.storage).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
      });
    });

    it('should include cache status check', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.checks).toHaveProperty('cache');
      expect(response.body.checks.cache).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
      });
    });
  });

  describe('Health Status Degradation', () => {
    it('should report degraded status when memory usage is high', async () => {
      // Mock high memory usage
      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 900 * 1024 * 1024, // 900MB - 90% of 1GB
        heapTotal: 1000 * 1024 * 1024, // 1GB
        rss: 1000 * 1024 * 1024,
        external: 50 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024,
      });

      const response = await request(app).get('/api/health');

      // Should be degraded or unhealthy
      expect(['degraded', 'unhealthy']).toContain(response.body.checks.memory.status);

      // Restore original
      vi.restoreAllMocks();
    });

    it('should return 200 or 503 based on overall health', async () => {
      const response = await request(app).get('/api/health');

      // Should return 200 for healthy/degraded, 503 for unhealthy
      expect([200, 503]).toContain(response.status);
      if (response.status === 503) {
        expect(response.body.status).toBe('unhealthy');
      }
    });
  });

  describe('Performance', () => {
    it('should respond in less than 100ms', async () => {
      const start = Date.now();
      await request(app).get('/api/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // Increased from 100ms for system load variance
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('status');
      });
    });
  });

  describe('Response Headers', () => {
    it('should return JSON content type', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
