import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService.js';
import { getAuthContext } from '../middleware/auth.js';
import { sendSuccess, parsePagination } from '../utils/apiResponse.js';
import { getRouteParam } from '../utils/request.js';
import { CourseStatus } from '../models/Course.js';

export class CourseController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const course = await CourseService.create(storeId, req.body);
      sendSuccess(res, course, {
        message: 'Course created successfully',
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
      const status = req.query.status as CourseStatus | undefined;

      const result = await CourseService.findAll(storeId, {
        page,
        limit,
        skip,
        search,
        status,
      });

      sendSuccess(res, result.courses, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const course = await CourseService.findById(storeId, getRouteParam(req, 'id'));
      sendSuccess(res, course);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      const course = await CourseService.update(storeId, getRouteParam(req, 'id'), req.body);
      sendSuccess(res, course, { message: 'Course updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = getAuthContext(req);
      await CourseService.delete(storeId, getRouteParam(req, 'id'));
      sendSuccess(res, null, { message: 'Course deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
