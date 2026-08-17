import { Badge } from '@shopify/polaris';

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { tone: 'success' | 'info' | 'warning' | 'critical' | 'attention' | undefined; label: string }> = {
  ACTIVE: { tone: 'success', label: 'Active' },
  INACTIVE: { tone: undefined, label: 'Inactive' },
  IN_PROGRESS: { tone: 'info', label: 'In Progress' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  ACTIVE_PRODUCT: { tone: 'success', label: 'Active' },
  DRAFT: { tone: 'attention', label: 'Draft' },
  ARCHIVED: { tone: undefined, label: 'Archived' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { tone: undefined, label: status };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
