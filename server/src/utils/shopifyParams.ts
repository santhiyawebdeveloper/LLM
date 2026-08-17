const SHOP_DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
const HOST_PARAM_REGEX = /^[A-Za-z0-9+/=_-]{1,512}$/;

export function isValidShopDomain(shop: string): boolean {
  return SHOP_DOMAIN_REGEX.test(shop);
}

export function isValidShopifyHost(host: string): boolean {
  return HOST_PARAM_REGEX.test(host);
}
