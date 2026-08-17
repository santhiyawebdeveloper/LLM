import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  IndexTable,
  InlineGrid,
  InlineStack,
  Badge,
} from '@shopify/polaris';
import { useQuery } from '@tanstack/react-query';
import { useDashboardSummary, useRecentEnrollments } from '../../hooks/useDashboard';
import { shopifyApi } from '../../services/shopifyApi';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { ApiClientError, getApiErrorMessage } from '../../services/api';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentEnrollments();
  const shopQuery = useQuery({
    queryKey: ['shopify', 'shop'],
    queryFn: () => shopifyApi.getShop(),
  });

  if (summaryQuery.isLoading || recentQuery.isLoading) {
    return (
      <Page title="Dashboard">
        <LoadingState lines={5} />
      </Page>
    );
  }

  if (summaryQuery.isError || recentQuery.isError) {
    const error = summaryQuery.error ?? recentQuery.error;
    const isUnauthorized = error instanceof ApiClientError && error.status === 401;
    return (
      <Page title="Dashboard">
        <ErrorState
          title={isUnauthorized ? 'Session expired' : 'Something went wrong'}
          message={getApiErrorMessage(error, 'Failed to load dashboard data')}
          onRetry={() => {
            summaryQuery.refetch();
            recentQuery.refetch();
          }}
        />
      </Page>
    );
  }

  const summary = summaryQuery.data?.data;
  const recentEnrollments = recentQuery.data?.data || [];
  const shop = shopQuery.data?.data;

  return (
    <Page title="Dashboard" subtitle="Learning Management System Overview">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Connected Shopify Store
                </Text>
                <Badge tone="success">Live GraphQL</Badge>
              </InlineStack>
              {shopQuery.isLoading ? (
                <LoadingState lines={2} />
              ) : shopQuery.isError || !shop ? (
                <Text as="p" tone="subdued">
                  Unable to load store information from Shopify Admin GraphQL API.
                </Text>
              ) : (
                <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Store name</Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">{shop.name}</Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Store domain</Text>
                    <Text as="p" variant="bodyMd">{shop.myshopifyDomain}</Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Shop email</Text>
                    <Text as="p" variant="bodyMd">{shop.email}</Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Shop ID</Text>
                    <Text as="p" variant="bodyMd">{shop.id}</Text>
                  </BlockStack>
                </InlineGrid>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 5 }} gap="400">
            <StatCard title="Total Courses" value={summary?.totalCourses ?? 0} />
            <StatCard title="Total Students" value={summary?.totalStudents ?? 0} />
            <StatCard title="Total Enrollments" value={summary?.totalEnrollments ?? 0} />
            <StatCard title="Completed" value={summary?.completedEnrollments ?? 0} />
            <StatCard title="In Progress" value={summary?.inProgressEnrollments ?? 0} />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Recently Enrolled Students
              </Text>
              {recentEnrollments.length === 0 ? (
                <EmptyState
                  heading="No enrollments yet"
                  description="Enroll students into courses to see them here."
                />
              ) : (
                <IndexTable
                  resourceName={{ singular: 'enrollment', plural: 'enrollments' }}
                  itemCount={recentEnrollments.length}
                  headings={[
                    { title: 'Student' },
                    { title: 'Email' },
                    { title: 'Course' },
                    { title: 'Enrollment Date' },
                    { title: 'Status' },
                  ]}
                  selectable={false}
                >
                  {recentEnrollments.map((enrollment, index) => (
                    <IndexTable.Row id={enrollment.id} key={enrollment.id} position={index}>
                      <IndexTable.Cell>
                        {typeof enrollment.student === 'object' ? enrollment.student.name : '-'}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {typeof enrollment.student === 'object' ? enrollment.student.email : '-'}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {typeof enrollment.course === 'object' ? enrollment.course.title : '-'}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <StatusBadge status={enrollment.status} />
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
