import { Card, BlockStack, Text } from '@shopify/polaris';

interface StatCardProps {
  title: string;
  value: number;
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingXl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}
