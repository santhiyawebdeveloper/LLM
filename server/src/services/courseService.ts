import { Types } from 'mongoose';
import { Course, CourseStatus, ICourse } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import {
  CreateCourseInput,
  UpdateCourseInput,
} from '../validators/index.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { buildSafeRegexFilter } from '../utils/escapeRegex.js';

export class CourseService {
  static async create(
    storeId: Types.ObjectId,
    data: CreateCourseInput
  ): Promise<ICourse> {
    const course = await Course.create({ ...data, storeId });
    return course;
  }

  static async findAll(
    storeId: Types.ObjectId,
    options: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
      status?: CourseStatus;
    }
  ) {
    const filter: Record<string, unknown> = { storeId };

    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.title = buildSafeRegexFilter(options.search);
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit),
      Course.countDocuments(filter),
    ]);

    return {
      courses,
      pagination: buildPaginationMeta(options.page, options.limit, total),
    };
  }

  static async findById(
    storeId: Types.ObjectId,
    courseId: string
  ): Promise<ICourse> {
    const course = await Course.findOne({ _id: courseId, storeId });
    if (!course) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }
    return course;
  }

  static async update(
    storeId: Types.ObjectId,
    courseId: string,
    data: UpdateCourseInput
  ): Promise<ICourse> {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, storeId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!course) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }

    return course;
  }

  static async delete(
    storeId: Types.ObjectId,
    courseId: string
  ): Promise<void> {
    const course = await Course.findOne({ _id: courseId, storeId });
    if (!course) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }

    const enrollmentCount = await Enrollment.countDocuments({
      storeId,
      courseId: course._id,
    });

    if (enrollmentCount > 0) {
      throw new ConflictError(
        'Cannot delete course with existing enrollments. Remove enrollments first.',
        'COURSE_HAS_ENROLLMENTS'
      );
    }

    await Course.findOneAndDelete({ _id: courseId, storeId });
  }
}
