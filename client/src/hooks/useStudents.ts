import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { studentApi } from '../services/studentApi';
import type { StudentListParams, CreateStudentInput, Student } from '../types/student';
import type { ApiResponse } from '../types/enrollment';

type StudentsQueryOptions = Pick<UseQueryOptions<ApiResponse<Student[]>>, 'enabled'>;

export function useStudents(params: StudentListParams = {}, options?: StudentsQueryOptions) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentDashboard(id: string) {
  return useQuery({
    queryKey: ['students', id, 'dashboard'],
    queryFn: () => studentApi.getDashboard(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentInput) => studentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
