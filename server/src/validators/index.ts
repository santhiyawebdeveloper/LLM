import { z } from 'zod';
import { CourseStatus } from '../models/Course.js';
import { EnrollmentStatus } from '../models/Enrollment.js';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  instructorName: z.string().min(1, 'Instructor name is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  duration: z.coerce.number().positive('Duration must be positive'),
  status: z.nativeEnum(CourseStatus).optional().default(CourseStatus.ACTIVE),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(CourseStatus).optional(),
});

export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Valid email is required').trim().toLowerCase(),
});

export const studentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid student ID'),
  courseId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid course ID'),
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus),
});

export const enrollmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.nativeEnum(EnrollmentStatus).optional(),
  search: z.string().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.errors) {
    const key = issue.path.join('.') || 'general';
    if (!formatted[key]) formatted[key] = [];
    formatted[key].push(issue.message);
  }
  return formatted;
}
