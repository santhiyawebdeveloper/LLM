import { Types } from 'mongoose';
import { Course } from '../models/Course.js';
import { Student } from '../models/Student.js';
import { Enrollment, EnrollmentStatus } from '../models/Enrollment.js';

export class DashboardService {
  static async getSummary(storeId: Types.ObjectId) {
    const [
      totalCourses,
      totalStudents,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
    ] = await Promise.all([
      Course.countDocuments({ storeId }),
      Student.countDocuments({ storeId }),
      Enrollment.countDocuments({ storeId }),
      Enrollment.countDocuments({ storeId, status: EnrollmentStatus.COMPLETED }),
      Enrollment.countDocuments({ storeId, status: EnrollmentStatus.IN_PROGRESS }),
    ]);

    return {
      totalCourses,
      totalStudents,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
    };
  }

  static async getRecentEnrollments(storeId: Types.ObjectId, limit = 10) {
    const enrollments = await Enrollment.find({ storeId })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ enrollmentDate: -1 })
      .limit(limit);

    return enrollments.map((e) => ({
      id: e._id,
      student: e.studentId,
      course: e.courseId,
      enrollmentDate: e.enrollmentDate,
      status: e.status,
    }));
  }
}
