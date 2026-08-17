import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  IndexTable,
  TextField,
  Select,
  Button,
  Modal,
  FormLayout,
  Text,
  BlockStack,
  InlineStack,
  Toast,
} from '@shopify/polaris';
import {
  useEnrollments,
  useCreateEnrollment,
  useUpdateEnrollmentStatus,
  useDeleteEnrollment,
} from '../../hooks/useEnrollments';
import { useStudents } from '../../hooks/useStudents';
import { useCourses } from '../../hooks/useCourses';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { EnrollmentStatus } from '../../types/enrollment';
import type { Enrollment, PopulatedCourse, PopulatedStudent } from '../../types/enrollment';
import { CourseStatus } from '../../types/course';
import { ApiClientError } from '../../services/api';

export function EnrollmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  const { data, isLoading, isError, refetch } = useEnrollments({
    page,
    limit: 20,
    status: (statusFilter as EnrollmentStatus) || undefined,
    search: search || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const { data: studentsData, isFetching: studentsFetching } = useStudents(
    { search: studentSearch || undefined, limit: 20 },
    { enabled: modalOpen }
  );
  const { data: coursesData, isFetching: coursesFetching } = useCourses(
    { search: courseSearch || undefined, limit: 20, status: CourseStatus.ACTIVE },
    { enabled: modalOpen }
  );

  const createMutation = useCreateEnrollment();
  const updateStatusMutation = useUpdateEnrollmentStatus();
  const deleteMutation = useDeleteEnrollment();

  const enrollments = data?.data || [];
  const pagination = data?.pagination;
  const students = studentsData?.data || [];
  const courses = coursesData?.data || [];

  const handleCreate = async () => {
    if (!studentId || !courseId) {
      setFormError('Please select both a student and a course');
      return;
    }
    setFormError('');
    try {
      await createMutation.mutateAsync({ studentId, courseId });
      setToast('Enrollment created successfully');
      setModalOpen(false);
      setStudentId('');
      setCourseId('');
      setStudentSearch('');
      setCourseSearch('');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError(error instanceof Error ? error.message : 'Enrollment failed');
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: EnrollmentStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      setToast('Status updated successfully');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setToast('Enrollment deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const getStudentName = (enrollment: Enrollment) => {
    const student = enrollment.studentId as PopulatedStudent;
    return typeof student === 'object' ? student.name : '-';
  };

  const getCourseTitle = (enrollment: Enrollment) => {
    const course = enrollment.courseId as PopulatedCourse;
    return typeof course === 'object' ? course.title : '-';
  };

  const toastMarkup = toast ? (
    <Toast content={toast} onDismiss={() => setToast(null)} />
  ) : null;

  if (isLoading) {
    return (
      <>
        <Page title="Enrollments"><LoadingState /></Page>
        {toastMarkup}
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Page title="Enrollments">
          <ErrorState message="Failed to load enrollments" onRetry={() => refetch()} />
        </Page>
        {toastMarkup}
      </>
    );
  }

  return (
    <>
      <Page
        title="Enrollments"
        primaryAction={{ content: 'New Enrollment', onAction: () => {
          setStudentSearch('');
          setCourseSearch('');
          setStudentId('');
          setCourseId('');
          setFormError('');
          setModalOpen(true);
        } }}
      >
        <BlockStack gap="400">
          <Card>
            <InlineStack gap="400">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search"
                  labelHidden
                  placeholder="Search student or course"
                  value={search}
                  onChange={setSearch}
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearch('')}
                />
              </div>
              <Select
                label="Status"
                labelHidden
                options={[
                  { label: 'All statuses', value: '' },
                  { label: 'In Progress', value: EnrollmentStatus.IN_PROGRESS },
                  { label: 'Completed', value: EnrollmentStatus.COMPLETED },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </InlineStack>
          </Card>

          {enrollments.length === 0 ? (
            <EmptyState
              heading="No enrollments found"
              description="Enroll students into courses to get started."
              action={{ content: 'New Enrollment', onAction: () => setModalOpen(true) }}
            />
          ) : (
            <Card padding="0">
              <IndexTable
                resourceName={{ singular: 'enrollment', plural: 'enrollments' }}
                itemCount={enrollments.length}
                headings={[
                  { title: 'Student' },
                  { title: 'Course' },
                  { title: 'Enrollment Date' },
                  { title: 'Status' },
                  { title: 'Actions' },
                ]}
                selectable={false}
                pagination={
                  pagination
                    ? {
                        hasNext: page < pagination.totalPages,
                        hasPrevious: page > 1,
                        onNext: () => setPage((p) => p + 1),
                        onPrevious: () => setPage((p) => p - 1),
                      }
                    : undefined
                }
              >
                {enrollments.map((enrollment, index) => (
                  <IndexTable.Row id={enrollment._id} key={enrollment._id} position={index}>
                    <IndexTable.Cell>{getStudentName(enrollment)}</IndexTable.Cell>
                    <IndexTable.Cell>{getCourseTitle(enrollment)}</IndexTable.Cell>
                    <IndexTable.Cell>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</IndexTable.Cell>
                    <IndexTable.Cell><StatusBadge status={enrollment.status} /></IndexTable.Cell>
                    <IndexTable.Cell>
                      <InlineStack gap="200">
                        {enrollment.status === EnrollmentStatus.IN_PROGRESS && (
                          <Button
                            size="slim"
                            onClick={() => handleStatusUpdate(enrollment._id, EnrollmentStatus.COMPLETED)}
                          >
                            Complete
                          </Button>
                        )}
                        {enrollment.status === EnrollmentStatus.COMPLETED && (
                          <Button
                            size="slim"
                            onClick={() => handleStatusUpdate(enrollment._id, EnrollmentStatus.IN_PROGRESS)}
                          >
                            In Progress
                          </Button>
                        )}
                        <Button size="slim" tone="critical" onClick={() => setDeleteTarget(enrollment)}>
                          Delete
                        </Button>
                      </InlineStack>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            </Card>
          )}
        </BlockStack>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="New Enrollment"
          primaryAction={{
            content: 'Enroll',
            loading: createMutation.isPending,
            onAction: handleCreate,
          }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
        >
          <Modal.Section>
            <FormLayout>
              {formError && (
                <Text as="p" tone="critical">{formError}</Text>
              )}
              <TextField
                label="Search students"
                value={studentSearch}
                onChange={setStudentSearch}
                placeholder="Search by name or email"
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setStudentSearch('')}
              />
              <Select
                label="Student"
                options={[
                  { label: studentsFetching ? 'Loading students...' : 'Select a student', value: '' },
                  ...students.map((s) => ({ label: `${s.name} (${s.email})`, value: s._id })),
                ]}
                value={studentId}
                onChange={setStudentId}
                disabled={studentsFetching}
              />
              <TextField
                label="Search courses"
                value={courseSearch}
                onChange={setCourseSearch}
                placeholder="Search by course title"
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setCourseSearch('')}
              />
              <Select
                label="Course"
                options={[
                  { label: coursesFetching ? 'Loading courses...' : 'Select an active course', value: '' },
                  ...courses.map((c) => ({ label: c.title, value: c._id })),
                ]}
                value={courseId}
                onChange={setCourseId}
                disabled={coursesFetching}
              />
              {studentSearch && students.length === 0 && !studentsFetching && (
                <Text as="p" tone="subdued">No students match your search.</Text>
              )}
              {courseSearch && courses.length === 0 && !coursesFetching && (
                <Text as="p" tone="subdued">No active courses match your search.</Text>
              )}
            </FormLayout>
          </Modal.Section>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Enrollment"
          message="Are you sure you want to delete this enrollment?"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </Page>
      {toastMarkup}
    </>
  );
}
