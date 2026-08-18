import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const { getEmbeddedAppUrl } = vi.hoisted(() => ({
  getEmbeddedAppUrl: vi.fn(),
}));

vi.mock('../config/shopifyApp.js', () => ({
  shopifyAppInstance: {
    api: {
      auth: {
        getEmbeddedAppUrl,
      },
    },
  },
}));

vi.mock('../config/env.js', () => ({
  env: {
    SHOPIFY_API_KEY: 'test-api-key',
  },
}));

import { redirectAfterOAuth } from '../middleware/redirectAfterOAuth.js';

function createMockResponse(session?: { shop: string }) {
  const res = {
    headersSent: false,
    locals: session ? { shopify: { session } } : {},
    redirect: vi.fn(),
  } as unknown as Response;

  return res;
}

describe('redirectAfterOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to embedded app URL when host param is present', async () => {
    getEmbeddedAppUrl.mockResolvedValue('https://admin.shopify.com/store/test/apps/test-api-key');

    const req = {
      query: {
        host: 'YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvdGVzdA',
      },
    } as unknown as Request;
    const res = createMockResponse({ shop: 'test.myshopify.com' });
    const next = vi.fn() as NextFunction;

    await redirectAfterOAuth(req, res, next);

    expect(getEmbeddedAppUrl).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      'https://admin.shopify.com/store/test/apps/test-api-key'
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects to Shopify Admin apps URL when host param is missing', async () => {
    const req = { query: {} } as unknown as Request;
    const res = createMockResponse({ shop: 'test.myshopify.com' });
    const next = vi.fn() as NextFunction;

    await redirectAfterOAuth(req, res, next);

    expect(getEmbeddedAppUrl).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      'https://test.myshopify.com/admin/apps/test-api-key'
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when no session is available', async () => {
    const req = { query: {} } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    await redirectAfterOAuth(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
