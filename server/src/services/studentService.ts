import { Types } from 'mongoose';
import { Student, IStudent } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { CreateStudentInput } from '../validators/index.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';

export class StudentService {
  static async create(
    storeId: Types.ObjectId,
    data: CreateStudentInput
  ): Promise<IStudent> {
    const existing = await Student.findOne({
      storeId,
      email: data.email.toLowerCase(),
    });

    if (existing) {
      throw new ConflictError(
        'A student with this email already exists',
        'DUPLICATE_STUDENT'
      );
    }

    const student = await Student.create({ ...data, storeId });
    return student;
  }

  static async findAll(
    storeId: Types.ObjectId,
    options: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
    }
  ) {
    const filter: Record<string, unknown> = { storeId };

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit),
      Student.countDocuments(filter),
    ]);

    const studentIds = students.map((s) => s._id);
    const enrollmentCounts =
      studentIds.length > 0
        ? await Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
            { $match: { storeId, studentId: { $in: studentIds } } },
            { $group: { _id: '$studentId', count: { $sum: 1 } } },
          ])
        : [];

    const countMap = new Map(
      enrollmentCounts.map((entry) => [entry._id.toString(), entry.count])
    );

    const studentsWithCounts = students.map((student) => ({
      ...student.toObject(),
      enrollmentCount: countMap.get(student._id.toString()) ?? 0,
    }));

    return {
      students: studentsWithCounts,
      pagination: buildPaginationMeta(options.page, options.limit, total),
    };
  }

  static async findById(
    storeId: Types.ObjectId,
    studentId: string
  ): Promise<IStudent> {
    const student = await Student.findOne({ _id: studentId, storeId });
    if (!student) {
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }
    return student;
  }

  static async getWithEnrollments(storeId: Types.ObjectId, studentId: string) {
    const student = await this.findById(storeId, studentId);

    const enrollments = await Enrollment.find({ storeId, studentId })
      .populate('courseId', 'title status category instructorName duration')
      .sort({ enrollmentDate: -1 });

    return { student, enrollments };
  }

  static async getDashboard(storeId: Types.ObjectId, studentId: string) {
    const student = await this.findById(storeId, studentId);

    const enrollments = await Enrollment.find({ storeId, studentId })
      .populate('courseId', 'title status category')
      .sort({ enrollmentDate: -1 });

    const totalEnrollments = enrollments.length;
    const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const inProgressCount = enrollments.filter((e) => e.status === 'IN_PROGRESS').length;

    return {
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      summary: {
        totalEnrollments,
        completedCount,
        inProgressCount,
      },
      enrollments: enrollments.map((e) => ({
        id: e._id,
        enrollmentDate: e.enrollmentDate,
        enrollmentStatus: e.status,
        course: e.courseId,
      })),
    };
  }
}
