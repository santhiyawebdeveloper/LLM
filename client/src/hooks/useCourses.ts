import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { courseApi } from '../services/courseApi';
import type { CourseListParams, CreateCourseInput, UpdateCourseInput } from '../types/course';
import type { ApiResponse } from '../types/enrollment';
import type { Course } from '../types/course';

function invalidateCourseQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['courses'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

type CoursesQueryOptions = Pick<UseQueryOptions<ApiResponse<Course[]>>, 'enabled'>;

export function useCourses(params: CourseListParams = {}, options?: CoursesQueryOptions) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => courseApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseInput) => courseApi.create(data),
    onSuccess: () => invalidateCourseQueries(queryClient),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseInput }) =>
      courseApi.update(id, data),
    onSuccess: () => invalidateCourseQueries(queryClient),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.delete(id),
    onSuccess: () => {
      invalidateCourseQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
