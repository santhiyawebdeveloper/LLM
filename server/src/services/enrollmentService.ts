import { Types } from 'mongoose';
import { Enrollment, EnrollmentStatus, IEnrollment } from '../models/Enrollment.js';
import { Course, CourseStatus } from '../models/Course.js';
import { Student } from '../models/Student.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../utils/errors.js';
import {
  CreateEnrollmentInput,
  UpdateEnrollmentStatusInput,
} from '../validators/index.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { buildSafeRegexFilter } from '../utils/escapeRegex.js';

export class EnrollmentService {
  static async create(
    storeId: Types.ObjectId,
    data: CreateEnrollmentInput
  ): Promise<IEnrollment> {
    const student = await Student.findOne({
      _id: data.studentId,
      storeId,
    });

    if (!student) {
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }

    const course = await Course.findOne({
      _id: data.courseId,
      storeId,
    });

    if (!course) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }

    if (course.status !== CourseStatus.ACTIVE) {
      throw new ValidationError('Cannot enroll in an inactive course');
    }

    const existing = await Enrollment.findOne({
      storeId,
      studentId: data.studentId,
      courseId: data.courseId,
    });

    if (existing) {
      throw new ConflictError(
        'Student is already enrolled in this course',
        'DUPLICATE_ENROLLMENT'
      );
    }

    try {
      const enrollment = await Enrollment.create({
        storeId,
        studentId: data.studentId,
        courseId: data.courseId,
        status: EnrollmentStatus.IN_PROGRESS,
      });
      return enrollment;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        throw new ConflictError(
          'Student is already enrolled in this course',
          'DUPLICATE_ENROLLMENT'
        );
      }
      throw error;
    }
  }

  static async findAll(
    storeId: Types.ObjectId,
    options: {
      page: number;
      limit: number;
      skip: number;
      status?: EnrollmentStatus;
      search?: string;
    }
  ) {
    const filter: Record<string, unknown> = { storeId };
    if (options.status) filter.status = options.status;

    if (options.search) {
      const searchFilter = buildSafeRegexFilter(options.search);
      const [students, courses] = await Promise.all([
        Student.find({
          storeId,
          $or: [{ name: searchFilter }, { email: searchFilter }],
        }).select('_id'),
        Course.find({ storeId, title: searchFilter }).select('_id'),
      ]);

      const studentIds = students.map((s) => s._id);
      const courseIds = courses.map((c) => c._id);

      if (studentIds.length === 0 && courseIds.length === 0) {
        return {
          enrollments: [],
          pagination: buildPaginationMeta(options.page, options.limit, 0),
        };
      }

      filter.$or = [
        { studentId: { $in: studentIds } },
        { courseId: { $in: courseIds } },
      ];
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('studentId', 'name email')
        .populate('courseId', 'title status')
        .sort({ enrollmentDate: -1 })
        .skip(options.skip)
        .limit(options.limit),
      Enrollment.countDocuments(filter),
    ]);

    return {
      enrollments,
      pagination: buildPaginationMeta(options.page, options.limit, total),
    };
  }

  static async findById(
    storeId: Types.ObjectId,
    enrollmentId: string
  ): Promise<IEnrollment> {
    const enrollment = await Enrollment.findOne({ _id: enrollmentId, storeId })
      .populate('studentId', 'name email')
      .populate('courseId', 'title status');

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found', 'ENROLLMENT_NOT_FOUND');
    }

    return enrollment;
  }

  static async updateStatus(
    storeId: Types.ObjectId,
    enrollmentId: string,
    data: UpdateEnrollmentStatusInput
  ): Promise<IEnrollment> {
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: enrollmentId, storeId },
      { $set: { status: data.status } },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name email')
      .populate('courseId', 'title status');

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found', 'ENROLLMENT_NOT_FOUND');
    }

    return enrollment;
  }

  static async delete(
    storeId: Types.ObjectId,
    enrollmentId: string
  ): Promise<void> {
    const enrollment = await Enrollment.findOneAndDelete({
      _id: enrollmentId,
      storeId,
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found', 'ENROLLMENT_NOT_FOUND');
    }
  }
}
