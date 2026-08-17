import { Banner, Card, BlockStack } from '@shopify/polaris';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Banner tone="critical" title={title} action={onRetry ? { content: 'Retry', onAction: onRetry } : undefined}>
          <p>{message}</p>
        </Banner>
      </BlockStack>
    </Card>
  );
}
