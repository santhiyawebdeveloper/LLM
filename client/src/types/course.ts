export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Course {
  _id: string;
  storeId: string;
  title: string;
  description: string;
  instructorName: string;
  category: string;
  duration: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  instructorName: string;
  category: string;
  duration: number;
  status?: CourseStatus;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus;
}
