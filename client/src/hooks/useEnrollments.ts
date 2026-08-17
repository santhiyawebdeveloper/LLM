import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentApi } from '../services/enrollmentApi';
import type { EnrollmentListParams, CreateEnrollmentInput, EnrollmentStatus } from '../types/enrollment';

function invalidateEnrollmentRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['enrollments'] });
  queryClient.invalidateQueries({ queryKey: ['students'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useEnrollments(params: EnrollmentListParams = {}) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: () => enrollmentApi.list(params),
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnrollmentInput) => enrollmentApi.create(data),
    onSuccess: () => invalidateEnrollmentRelatedQueries(queryClient),
  });
}

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollmentStatus }) =>
      enrollmentApi.updateStatus(id, status),
    onSuccess: () => invalidateEnrollmentRelatedQueries(queryClient),
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentApi.delete(id),
    onSuccess: () => invalidateEnrollmentRelatedQueries(queryClient),
  });
}
