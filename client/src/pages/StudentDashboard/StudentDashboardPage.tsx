import {
  Page,
  Card,
  BlockStack,
  Text,
  IndexTable,
  InlineGrid,
} from '@shopify/polaris';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudentDashboard } from '../../hooks/useStudents';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { StatusBadge } from '../../components/StatusBadge';

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">{title}</Text>
        <Text as="p" variant="headingXl">{value}</Text>
      </BlockStack>
    </Card>
  );
}

export function StudentDashboardPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useStudentDashboard(studentId || '');

  if (isLoading) {
    return <Page title="Student Dashboard"><LoadingState /></Page>;
  }

  if (isError || !data?.data) {
    return (
      <Page title="Student Dashboard">
        <ErrorState message="Failed to load student dashboard" onRetry={() => refetch()} />
      </Page>
    );
  }

  const { student, summary, enrollments } = data.data;

  return (
    <Page
      title={`${student.name}'s Dashboard`}
      subtitle={student.email}
      backAction={{ content: 'Students', onAction: () => navigate('/students') }}
    >
      <BlockStack gap="400">
        <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
          <StatCard title="Total Enrollments" value={summary.totalEnrollments} />
          <StatCard title="Completed" value={summary.completedCount} />
          <StatCard title="In Progress" value={summary.inProgressCount} />
        </InlineGrid>

        <Card padding="0">
          <BlockStack gap="400">
            <div style={{ padding: '16px' }}>
              <Text as="h2" variant="headingMd">Enrolled Courses</Text>
            </div>
            {enrollments.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <Text as="p" tone="subdued">No enrolled courses.</Text>
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'course', plural: 'courses' }}
                itemCount={enrollments.length}
                headings={[
                  { title: 'Course' },
                  { title: 'Enrollment Date' },
                  { title: 'Course Status' },
                  { title: 'Enrollment Status' },
                ]}
                selectable={false}
              >
                {enrollments.map((enrollment, index) => (
                  <IndexTable.Row id={enrollment.id} key={enrollment.id} position={index}>
                    <IndexTable.Cell>{enrollment.course?.title || '-'}</IndexTable.Cell>
                    <IndexTable.Cell>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</IndexTable.Cell>
                    <IndexTable.Cell><StatusBadge status={enrollment.course?.status || ''} /></IndexTable.Cell>
                    <IndexTable.Cell><StatusBadge status={enrollment.enrollmentStatus} /></IndexTable.Cell>
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
