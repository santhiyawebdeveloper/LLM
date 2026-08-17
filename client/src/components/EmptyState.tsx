import { EmptyState as PolarisEmptyState } from '@shopify/polaris';

interface EmptyStateProps {
  heading: string;
  description?: string;
  action?: { content: string; onAction: () => void };
}

export function EmptyState({ heading, description, action }: EmptyStateProps) {
  return (
    <PolarisEmptyState
      heading={heading}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      action={action}
    >
      {description && <p>{description}</p>}
    </PolarisEmptyState>
  );
}
