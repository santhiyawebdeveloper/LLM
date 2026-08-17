import {
  Page,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Button,
} from '@shopify/polaris';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourse } from '../../hooks/useCourses';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { StatusBadge } from '../../components/StatusBadge';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useCourse(id || '');

  if (isLoading) {
    return <Page title="Course Details"><LoadingState /></Page>;
  }

  if (isError || !data?.data) {
    return (
      <Page title="Course Details">
        <ErrorState message="Failed to load course" onRetry={() => refetch()} />
      </Page>
    );
  }

  const course = data.data;

  return (
    <Page
      title={course.title}
      subtitle={course.category}
      backAction={{ content: 'Courses', onAction: () => navigate('/courses') }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Course Information</Text>
            <InlineStack gap="400" wrap>
              <Text as="p"><strong>Instructor:</strong> {course.instructorName}</Text>
              <Text as="p"><strong>Duration:</strong> {course.duration} hours</Text>
              <Text as="p"><strong>Status:</strong></Text>
              <StatusBadge status={course.status} />
              <Text as="p"><strong>Created:</strong> {new Date(course.createdAt).toLocaleDateString()}</Text>
            </InlineStack>
            <BlockStack gap="200">
              <Text as="p" variant="headingSm">Description</Text>
              <Text as="p">{course.description}</Text>
            </BlockStack>
          </BlockStack>
        </Card>
        <InlineStack gap="200">
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </InlineStack>
      </BlockStack>
    </Page>
  );
}
