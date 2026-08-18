const SHOP_DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

/** True when the app runs inside Shopify Admin (embedded iframe). */
export function isShopifyEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe access throws; we're embedded.
    return true;
  }
}

export function isValidShopDomain(shop: string): boolean {
  return SHOP_DOMAIN_REGEX.test(shop);
}

/** Normalize user input like "my-store" → "my-store.myshopify.com". */
export function normalizeShopDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const domain = trimmed.endsWith('.myshopify.com')
    ? trimmed
    : `${trimmed.replace(/\.myshopify\.com$/i, '')}.myshopify.com`;

  return isValidShopDomain(domain) ? domain : null;
}

export function getShopifyAdminAppUrl(shop: string, apiKey: string): string {
  return `https://${shop}/admin/apps/${apiKey}`;
}

export function getShopFromUrl(): string | null {
  const shop = new URLSearchParams(window.location.search).get('shop');
  return shop && isValidShopDomain(shop) ? shop : null;
}
