/** True when the app runs inside Shopify Admin (embedded iframe). */
export function isShopifyEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe access throws; we're embedded.
    return true;
  }
}
