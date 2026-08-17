import { Modal, Text } from '@shopify/polaris';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      primaryAction={{
        content: confirmText,
        destructive: true,
        loading,
        onAction: onConfirm,
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onCancel }]}
    >
      <Modal.Section>
        <Text as="p">{message}</Text>
      </Modal.Section>
    </Modal>
  );
}
