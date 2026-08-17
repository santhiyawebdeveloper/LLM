import {
  Page,
  Card,
  BlockStack,
  Text,
  IndexTable,
} from '@shopify/polaris';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent } from '../../hooks/useStudents';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { StatusBadge } from '../../components/StatusBadge';
import type { EnrollmentWithCourse } from '../../types/enrollment';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useStudent(id || '');

  if (isLoading) {
    return <Page title="Student Details"><LoadingState /></Page>;
  }

  if (isError || !data?.data) {
    return (
      <Page title="Student Details">
        <ErrorState message="Failed to load student" onRetry={() => refetch()} />
      </Page>
    );
  }

  const { student, enrollments } = data.data;

  return (
    <Page
      title={student.name}
      subtitle={student.email}
      backAction={{ content: 'Students', onAction: () => navigate('/students') }}
      primaryAction={{
        content: 'View Dashboard',
        onAction: () => navigate(`/students/${student._id}/dashboard`),
      }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">Student Information</Text>
            <Text as="p"><strong>Name:</strong> {student.name}</Text>
            <Text as="p"><strong>Email:</strong> {student.email}</Text>
            <Text as="p"><strong>Joined:</strong> {new Date(student.createdAt).toLocaleDateString()}</Text>
          </BlockStack>
        </Card>

        <Card padding="0">
          <BlockStack gap="400">
            <div style={{ padding: '16px' }}>
              <Text as="h2" variant="headingMd">Enrolled Courses</Text>
            </div>
            {enrollments.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <Text as="p" tone="subdued">No enrollments yet.</Text>
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'enrollment', plural: 'enrollments' }}
                itemCount={enrollments.length}
                headings={[
                  { title: 'Course' },
                  { title: 'Enrollment Date' },
                  { title: 'Status' },
                ]}
                selectable={false}
              >
                {enrollments.map((enrollment: EnrollmentWithCourse, index: number) => (
                  <IndexTable.Row id={enrollment._id} key={enrollment._id} position={index}>
                    <IndexTable.Cell>{enrollment.courseId?.title || '-'}</IndexTable.Cell>
                    <IndexTable.Cell>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</IndexTable.Cell>
                    <IndexTable.Cell><StatusBadge status={enrollment.status} /></IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
