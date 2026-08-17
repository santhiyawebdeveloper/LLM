import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollmentService.js';
import { getAuthContext } from '../middleware/auth.js';
import { sendSuccess, parsePagination } from '../utils/apiResponse.js';
import { getRouteParam } from '../utils/request.js';
import { EnrollmentStatus } from '../models/Enrollment.js';

export class EnrollmentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const enrollment = await EnrollmentService.create(storeId, req.body);
      sendSuccess(res, enrollment, {
        message: 'Enrollment created successfully',
        status: 201,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
      const status = req.query.status as EnrollmentStatus | undefined;
      const search = req.query.search as string | undefined;

      const result = await EnrollmentService.findAll(storeId, {
        page,
        limit,
        skip,
        status,
        search,
      });

      sendSuccess(res, result.enrollments, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const enrollment = await EnrollmentService.findById(storeId, getRouteParam(req, 'id'));
      sendSuccess(res, enrollment);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const enrollment = await EnrollmentService.updateStatus(
        storeId,
        getRouteParam(req, 'id'),
        req.body
      );
      sendSuccess(res, enrollment, { message: 'Enrollment status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      await EnrollmentService.delete(storeId, getRouteParam(req, 'id'));
      sendSuccess(res, null, { message: 'Enrollment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
