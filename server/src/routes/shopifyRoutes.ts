import { Router } from 'express';
import { ShopifyController } from '../controllers/shopifyController.js';

const router = Router();

router.get('/shop', ShopifyController.getShop);
router.get('/products', ShopifyController.getProducts);

export default router;
