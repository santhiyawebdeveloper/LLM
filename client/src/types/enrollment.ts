export enum EnrollmentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Enrollment {
  _id: string;
  storeId: string;
  studentId: PopulatedStudent | string;
  courseId: PopulatedCourse | string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedStudent {
  _id: string;
  name: string;
  email: string;
}

export interface PopulatedCourse {
  _id: string;
  title: string;
  status: string;
}

export interface EnrollmentWithCourse {
  _id: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  courseId: {
    _id: string;
    title: string;
    status: string;
    category?: string;
    instructorName?: string;
    duration?: number;
  };
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
}

export interface EnrollmentListParams {
  page?: number;
  limit?: number;
  status?: EnrollmentStatus;
  search?: string;
}

export interface DashboardSummary {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
}

export interface RecentEnrollment {
  id: string;
  student: PopulatedStudent;
  course: { _id: string; title: string };
  enrollmentDate: string;
  status: EnrollmentStatus;
}

export interface ShopifyShop {
  id: string;
  name: string;
  email: string;
  myshopifyDomain: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  status: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}
