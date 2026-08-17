import { useState, useCallback, useEffect } from 'react';
import {
  Page,
  Card,
  IndexTable,
  TextField,
  Button,
  Modal,
  FormLayout,
  Text,
  BlockStack,
  InlineStack,
  Toast,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { useStudents, useCreateStudent } from '../../hooks/useStudents';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import type { CreateStudentInput } from '../../types/student';
import { ApiClientError } from '../../services/api';

const emptyForm: CreateStudentInput = { name: '', email: '' };

export function StudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateStudentInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useStudents({
    page,
    limit: 20,
    search: search || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const createMutation = useCreateStudent();
  const students = data?.data || [];
  const pagination = data?.pagination;

  const openCreateModal = useCallback(() => {
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Valid email is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      await createMutation.mutateAsync(form);
      setToast('Student created successfully');
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

  const toastMarkup = toast ? (
    <Toast content={toast} onDismiss={() => setToast(null)} />
  ) : null;

  if (isLoading) {
    return (
      <>
        <Page title="Students"><LoadingState /></Page>
        {toastMarkup}
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Page title="Students">
          <ErrorState message="Failed to load students" onRetry={() => refetch()} />
        </Page>
        {toastMarkup}
      </>
    );
  }

  return (
    <>
      <Page
        title="Students"
        primaryAction={{ content: 'Add Student', onAction: openCreateModal }}
      >
        <BlockStack gap="400">
          <Card>
            <TextField
              label="Search"
              labelHidden
              placeholder="Search by name or email"
              value={search}
              onChange={setSearch}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setSearch('')}
            />
          </Card>

          {students.length === 0 ? (
            <EmptyState
              heading="No students found"
              description="Add students to enroll them in courses."
              action={{ content: 'Add Student', onAction: openCreateModal }}
            />
          ) : (
            <Card padding="0">
              <IndexTable
                resourceName={{ singular: 'student', plural: 'students' }}
                itemCount={students.length}
                headings={[
                  { title: 'Student Name' },
                  { title: 'Email' },
                  { title: 'Enrollment Count' },
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
                {students.map((student, index) => (
                  <IndexTable.Row id={student._id} key={student._id} position={index}>
                    <IndexTable.Cell>
                      <Text as="span" fontWeight="semibold">{student.name}</Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{student.email}</IndexTable.Cell>
                    <IndexTable.Cell>{student.enrollmentCount ?? 0}</IndexTable.Cell>
                    <IndexTable.Cell>
                      <InlineStack gap="200">
                        <Button size="slim" onClick={() => navigate(`/students/${student._id}`)}>View</Button>
                        <Button size="slim" onClick={() => navigate(`/students/${student._id}/dashboard`)}>Dashboard</Button>
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
          title="Add Student"
          primaryAction={{
            content: 'Create',
            loading: createMutation.isPending,
            onAction: handleSubmit,
          }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                error={formErrors.name}
                autoComplete="off"
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                error={formErrors.email}
                autoComplete="off"
              />
            </FormLayout>
          </Modal.Section>
        </Modal>
      </Page>
      {toastMarkup}
    </>
  );
}
