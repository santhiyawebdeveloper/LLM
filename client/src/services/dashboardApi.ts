import { apiFetch } from './api';
import type { DashboardSummary, RecentEnrollment } from '../types/enrollment';

export const dashboardApi = {
  getSummary: () => apiFetch<DashboardSummary>('/dashboard/summary'),
  getRecentEnrollments: () => apiFetch<RecentEnrollment[]>('/dashboard/recent-enrollments'),
};
