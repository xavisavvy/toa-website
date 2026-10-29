import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserById = vi.fn();

vi.mock('../server/auth', async () => {
  const actual = await vi.importActual<typeof import('../server/auth')>('../server/auth');
  return { ...actual, getUserById: (id: string) => getUserById(id) };
});

vi.mock('../server/security', () => ({ logSecurityEvent: vi.fn() }));

const { requireAdmin } = await import('../server/auth-middleware');

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  isActive: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
};

// requireAdmin used to trust the copy of the user stored in the session at
// login (up to 7 days old). It now re-reads the user on every request.
function buildApp() {
  const app = express();
  const destroy = vi.fn((cb: () => void) => cb());
  app.use((req, _res, next) => {
    (req as unknown as { session: unknown }).session = { user: adminUser, destroy };
    next();
  });
  app.get('/admin', requireAdmin, (req, res) => {
    res.json({ email: req.user?.email });
  });
  return { app, destroy };
}

describe('requireAdmin', () => {
  beforeEach(() => {
    getUserById.mockReset();
  });

  it('lets an active admin through with the fresh user record', async () => {
    getUserById.mockResolvedValue({ ...adminUser, email: 'renamed@example.com' });
    const { app } = buildApp();

    const response = await request(app).get('/admin');

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('renamed@example.com');
    expect(getUserById).toHaveBeenCalledWith('admin-1');
  });

  it.each([
    ['deactivated', { ...adminUser, isActive: 0 }],
    ['demoted', { ...adminUser, role: 'customer' }],
    ['deleted', null],
  ])('revokes the session of a %s admin', async (_label, current) => {
    getUserById.mockResolvedValue(current);
    const { app, destroy } = buildApp();

    const response = await request(app).get('/admin');

    expect(response.status).toBe(401);
    expect(destroy).toHaveBeenCalled();
  });

  it('fails closed when the lookup throws', async () => {
    getUserById.mockRejectedValue(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app } = buildApp();

    const response = await request(app).get('/admin');

    expect(response.status).toBe(500);
  });
});
