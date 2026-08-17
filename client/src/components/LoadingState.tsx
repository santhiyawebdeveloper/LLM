import { Card, SkeletonBodyText, BlockStack } from '@shopify/polaris';

interface LoadingStateProps {
  lines?: number;
}

export function LoadingState({ lines = 3 }: LoadingStateProps) {
  return (
    <Card>
      <BlockStack gap="400">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBodyText key={i} lines={1} />
        ))}
      </BlockStack>
    </Card>
  );
}
