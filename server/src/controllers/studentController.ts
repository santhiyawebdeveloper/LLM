import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService.js';
import { getAuthContext } from '../middleware/auth.js';
import { sendSuccess, parsePagination } from '../utils/apiResponse.js';
import { getRouteParam } from '../utils/request.js';

export class StudentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const student = await StudentService.create(storeId, req.body);
      sendSuccess(res, student, {
        message: 'Student created successfully',
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
      const search = req.query.search as string | undefined;

      const result = await StudentService.findAll(storeId, {
        page,
        limit,
        skip,
        search,
      });

      sendSuccess(res, result.students, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const result = await StudentService.getWithEnrollments(storeId, getRouteParam(req, 'id'));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const dashboard = await StudentService.getDashboard(storeId, getRouteParam(req, 'id'));
      sendSuccess(res, dashboard);
    } catch (error) {
      next(error);
    }
  }
}
