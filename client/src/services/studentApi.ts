import { apiFetch, buildQueryString } from './api';
import type {
  Student,
  CreateStudentInput,
  StudentListParams,
  StudentDetail,
  StudentDashboard,
} from '../types/student';

export const studentApi = {
  list: (params: StudentListParams = {}) =>
    apiFetch<Student[]>(`/students${buildQueryString(params as Record<string, string | number | undefined>)}`),

  getById: (id: string) => apiFetch<StudentDetail>(`/students/${id}`),

  create: (data: CreateStudentInput) =>
    apiFetch<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),

  getDashboard: (id: string) => apiFetch<StudentDashboard>(`/students/${id}/dashboard`),
};
