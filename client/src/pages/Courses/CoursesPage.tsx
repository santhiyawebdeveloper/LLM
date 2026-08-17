import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../../hooks/useCourses';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { CourseStatus, type Course, type CreateCourseInput } from '../../types/course';
import { ApiClientError } from '../../services/api';

const emptyForm: CreateCourseInput = {
  title: '',
  description: '',
  instructorName: '',
  category: '',
  duration: 1,
  status: CourseStatus.ACTIVE,
};

export function CoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [form, setForm] = useState<CreateCourseInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useCourses({
    page,
    limit: 20,
    search: search || undefined,
    status: (statusFilter as CourseStatus) || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const courses = data?.data || [];
  const pagination = data?.pagination;

  const openCreateModal = useCallback(() => {
    setEditingCourse(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      instructorName: course.instructorName,
      category: course.category,
      duration: course.duration,
      status: course.status,
    });
    setFormErrors({});
    setModalOpen(true);
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.instructorName.trim()) errors.instructorName = 'Instructor is required';
    if (!form.category.trim()) errors.category = 'Category is required';
    if (!form.duration || form.duration <= 0) errors.duration = 'Duration must be positive';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingCourse) {
        await updateMutation.mutateAsync({ id: editingCourse._id, data: form });
        setToast('Course updated successfully');
      } else {
        await createMutation.mutateAsync(form);
        setToast('Course created successfully');
      }
      setModalOpen(false);
    } catch (error) {
      if (error instanceof ApiClientError && error.errors) {
        const errs: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(error.errors)) {
          errs[key] = msgs[0];
        }
        setFormErrors(errs);
      } else {
        setToast(error instanceof Error ? error.message : 'Operation failed');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setToast('Course deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const toastMarkup = toast ? (
    <Toast content={toast} onDismiss={() => setToast(null)} />
  ) : null;

  if (isLoading) {
    return (
      <>
        <Page title="Courses"><LoadingState /></Page>
        {toastMarkup}
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Page title="Courses">
          <ErrorState message="Failed to load courses" onRetry={() => refetch()} />
        </Page>
        {toastMarkup}
      </>
    );
  }

  return (
    <>
      <Page
        title="Courses"
        primaryAction={{ content: 'Add Course', onAction: openCreateModal }}
      >
        <BlockStack gap="400">
          <Card>
            <InlineStack gap="400">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search"
                  labelHidden
                  placeholder="Search by title"
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
                  { label: 'Active', value: CourseStatus.ACTIVE },
                  { label: 'Inactive', value: CourseStatus.INACTIVE },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </InlineStack>
          </Card>

          {courses.length === 0 ? (
            <EmptyState
              heading="No courses found"
              description="Create your first course to get started."
              action={{ content: 'Add Course', onAction: openCreateModal }}
            />
          ) : (
            <Card padding="0">
              <IndexTable
                resourceName={{ singular: 'course', plural: 'courses' }}
                itemCount={courses.length}
                headings={[
                  { title: 'Course Title' },
                  { title: 'Instructor' },
                  { title: 'Category' },
                  { title: 'Duration (hrs)' },
                  { title: 'Status' },
                  { title: 'Created Date' },
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
                {courses.map((course, index) => (
                  <IndexTable.Row id={course._id} key={course._id} position={index}>
                    <IndexTable.Cell>
                      <Text as="span" fontWeight="semibold">{course.title}</Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{course.instructorName}</IndexTable.Cell>
                    <IndexTable.Cell>{course.category}</IndexTable.Cell>
                    <IndexTable.Cell>{course.duration}</IndexTable.Cell>
                    <IndexTable.Cell><StatusBadge status={course.status} /></IndexTable.Cell>
                    <IndexTable.Cell>{new Date(course.createdAt).toLocaleDateString()}</IndexTable.Cell>
                    <IndexTable.Cell>
                      <InlineStack gap="200">
                        <Button size="slim" onClick={() => navigate(`/courses/${course._id}`)}>View</Button>
                        <Button size="slim" onClick={() => openEditModal(course)}>Edit</Button>
                        <Button size="slim" tone="critical" onClick={() => setDeleteTarget(course)}>Delete</Button>
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
          title={editingCourse ? 'Edit Course' : 'Create Course'}
          primaryAction={{
            content: editingCourse ? 'Save' : 'Create',
            loading: createMutation.isPending || updateMutation.isPending,
            onAction: handleSubmit,
          }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Title"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                error={formErrors.title}
                autoComplete="off"
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                error={formErrors.description}
                multiline={3}
                autoComplete="off"
              />
              <TextField
                label="Instructor Name"
                value={form.instructorName}
                onChange={(v) => setForm({ ...form, instructorName: v })}
                error={formErrors.instructorName}
                autoComplete="off"
              />
              <TextField
                label="Category"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                error={formErrors.category}
                autoComplete="off"
              />
              <TextField
                label="Duration (hours)"
                type="number"
                value={String(form.duration)}
                onChange={(v) => setForm({ ...form, duration: parseInt(v, 10) || 0 })}
                error={formErrors.duration}
                autoComplete="off"
              />
              <Select
                label="Status"
                options={[
                  { label: 'Active', value: CourseStatus.ACTIVE },
                  { label: 'Inactive', value: CourseStatus.INACTIVE },
                ]}
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as CourseStatus })}
              />
            </FormLayout>
          </Modal.Section>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Course"
          message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </Page>
      {toastMarkup}
    </>
  );
}
