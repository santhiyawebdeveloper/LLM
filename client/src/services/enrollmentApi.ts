import { apiFetch, buildQueryString } from './api';
import type {
  Enrollment,
  CreateEnrollmentInput,
  EnrollmentListParams,
  EnrollmentStatus,
} from '../types/enrollment';

export const enrollmentApi = {
  list: (params: EnrollmentListParams = {}) =>
    apiFetch<Enrollment[]>(`/enrollments${buildQueryString(params as Record<string, string | number | undefined>)}`),

  getById: (id: string) => apiFetch<Enrollment>(`/enrollments/${id}`),

  create: (data: CreateEnrollmentInput) =>
    apiFetch<Enrollment>('/enrollments', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: EnrollmentStatus) =>
    apiFetch<Enrollment>(`/enrollments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiFetch<null>(`/enrollments/${id}`, { method: 'DELETE' }),
};
