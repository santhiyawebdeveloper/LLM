import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.get('/summary', DashboardController.getSummary);
router.get('/recent-enrollments', DashboardController.getRecentEnrollments);

export default router;
