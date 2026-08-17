import { apiFetch } from './api';
import type { ShopifyShop, ShopifyProduct } from '../types/enrollment';

export const shopifyApi = {
  getShop: () => apiFetch<ShopifyShop>('/shopify/shop'),
  getProducts: () => apiFetch<ShopifyProduct[]>('/shopify/products'),
};
