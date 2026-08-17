import { z } from 'zod';
import { CourseStatus } from '../models/Course.js';
import { EnrollmentStatus } from '../models/Enrollment.js';

const titleField = z.string().trim().min(1, 'Title is required').max(200, 'Title must be 200 characters or less');
const descriptionField = z
  .string()
  .trim()
  .min(1, 'Description is required')
  .max(2000, 'Description must be 2000 characters or less');
const instructorField = z
  .string()
  .trim()
  .min(1, 'Instructor name is required')
  .max(150, 'Instructor name must be 150 characters or less');
const categoryField = z
  .string()
  .trim()
  .min(1, 'Category is required')
  .max(100, 'Category must be 100 characters or less');
const studentNameField = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(150, 'Name must be 150 characters or less');
const emailField = z
  .string()
  .trim()
  .email('Valid email is required')
  .max(254, 'Email must be 254 characters or less')
  .toLowerCase();
const durationField = z.coerce
  .number()
  .int('Duration must be a whole number')
  .min(1, 'Duration must be at least 1 hour')
  .max(10000, 'Duration must be 10000 hours or less');
const searchField = z.string().trim().max(200, 'Search must be 200 characters or less').optional();

export const createCourseSchema = z.object({
  title: titleField,
  description: descriptionField,
  instructorName: instructorField,
  category: categoryField,
  duration: durationField,
  status: z.nativeEnum(CourseStatus).optional().default(CourseStatus.ACTIVE),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: searchField,
  status: z.nativeEnum(CourseStatus).optional(),
});

export const createStudentSchema = z.object({
  name: studentNameField,
  email: emailField,
});

export const studentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: searchField,
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
  search: searchField,
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
