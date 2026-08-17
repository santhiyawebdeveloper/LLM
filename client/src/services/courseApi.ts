import { apiFetch, buildQueryString } from './api';
import type { Course, CreateCourseInput, CourseListParams, UpdateCourseInput } from '../types/course';

export const courseApi = {
  list: (params: CourseListParams = {}) =>
    apiFetch<Course[]>(`/courses${buildQueryString(params as Record<string, string | number | undefined>)}`),

  getById: (id: string) => apiFetch<Course>(`/courses/${id}`),

  create: (data: CreateCourseInput) =>
    apiFetch<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateCourseInput) =>
    apiFetch<Course>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<null>(`/courses/${id}`, { method: 'DELETE' }),
};
