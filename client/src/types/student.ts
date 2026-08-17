import type { EnrollmentWithCourse } from './enrollment';

export interface Student {
  _id: string;
  storeId: string;
  name: string;
  email: string;
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  name: string;
  email: string;
}

export interface StudentListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface StudentDetail {
  student: Student;
  enrollments: EnrollmentWithCourse[];
}

export interface StudentDashboard {
  student: {
    id: string;
    name: string;
    email: string;
  };
  summary: {
    totalEnrollments: number;
    completedCount: number;
    inProgressCount: number;
  };
  enrollments: Array<{
    id: string;
    enrollmentDate: string;
    enrollmentStatus: string;
    course: {
      _id: string;
      title: string;
      status: string;
      category: string;
    };
  }>;
}
