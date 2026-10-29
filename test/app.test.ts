import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureApp } from '../server/app';

// configureApp is the middleware stack shared by the production entry (root
// index.ts) and the dev entry. Production used to assemble its own stack and
// silently lost sessions, CSRF protection and the webhook raw-body parsers.

function buildApp() {
  const app = express();
  const result = configureApp(app, { log: () => {} });

  app.post('/api/webhooks/printful', (req, res) => {
    res.json({ isBuffer: Buffer.isBuffer(req.body) });
  });
  app.post('/api/stripe/webhook', (req, res) => {
    res.json({ isBuffer: Buffer.isBuffer(req.body) });
  });
  app.post('/api/echo', (req, res) => {
    res.json({ body: req.body, hasSession: !!req.session });
  });

  return { app, ...result };
}

describe('configureApp', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('gives both webhooks the raw body and other routes parsed JSON', async () => {
    const { app } = buildApp();

    for (const path of ['/api/webhooks/printful', '/api/stripe/webhook']) {
      const response = await request(app)
        .post(path)
        .set('Content-Type', 'application/json')
        .send('{"a":1}');
      expect(response.body).toEqual({ isBuffer: true });
    }

    const echo = await request(app).post('/api/echo').send({ a: 1 });
    expect(echo.body.body).toEqual({ a: 1 });
  });

  it('enables sessions outside production even without SESSION_SECRET', async () => {
    delete process.env.SESSION_SECRET;
    const { app, sessionsEnabled } = buildApp();

    expect(sessionsEnabled).toBe(true);
    const response = await request(app).post('/api/echo').send({});
    expect(response.body.hasSession).toBe(true);
  });

  it('disables sessions in production when SESSION_SECRET is missing or short', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;

    delete process.env.SESSION_SECRET;
    expect(buildApp().sessionsEnabled).toBe(false);

    process.env.SESSION_SECRET = 'too-short';
    expect(buildApp().sessionsEnabled).toBe(false);
  });

  it('enables sessions in production with a strong SESSION_SECRET', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    process.env.SESSION_SECRET = 'x'.repeat(48);

    expect(buildApp().sessionsEnabled).toBe(true);
  });

  it('sets a secure, httpOnly, sameSite=lax cookie in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    process.env.SESSION_SECRET = 'x'.repeat(48);
    const { app } = buildApp();
    app.post('/api/touch-session', (req, res) => {
      (req.session as unknown as { touched: boolean }).touched = true;
      res.json({ ok: true });
    });

    const response = await request(app)
      .post('/api/touch-session')
      .set('X-Forwarded-Proto', 'https');

    const cookie = String(response.headers['set-cookie']);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('blocks cross-site POSTs but not webhooks', async () => {
    const { app } = buildApp();

    // A foreign Origin is already refused by CORS outside development
    const crossOrigin = await request(app)
      .post('/api/echo')
      .set('Origin', 'https://evil.example')
      .send({});
    expect(crossOrigin.status).toBeGreaterThanOrEqual(400);
    expect(crossOrigin.body.body).toBeUndefined();

    // No Origin, but the Referer gives the cross-site source away
    const crossReferer = await request(app)
      .post('/api/echo')
      .set('Referer', 'https://evil.example/attack.html')
      .send({});
    expect(crossReferer.status).toBe(403);

    const webhook = await request(app)
      .post('/api/webhooks/printful')
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(webhook.status).toBe(200);
  });

  it('allows POSTs from a configured allowed origin', async () => {
    process.env.ALLOWED_ORIGINS = 'https://talesofaneria.com,https://www.talesofaneria.com';
    const { app } = buildApp();

    const response = await request(app)
      .post('/api/echo')
      .set('Origin', 'https://www.talesofaneria.com')
      .send({});
    expect(response.status).toBe(200);
  });
});
