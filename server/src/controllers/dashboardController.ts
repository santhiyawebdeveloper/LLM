import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { getAuthContext } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const summary = await DashboardService.getSummary(storeId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  static async getRecentEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const enrollments = await DashboardService.getRecentEnrollments(storeId);
      sendSuccess(res, enrollments);
    } catch (error) {
      next(error);
    }
  }
}
