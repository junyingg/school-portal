import { Modal } from "antd"
import type { ReactNode } from "react"
import { ErrorBanner } from "./ErrorBanner.tsx"

interface ConfirmDialogProps {
  readonly title: string
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly isConfirming: boolean
  readonly errorMessage: string | undefined
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly children: ReactNode
}

export function ConfirmDialog({
  title,
  confirmLabel,
  cancelLabel,
  isConfirming,
  errorMessage,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open
      title={title}
      okText={confirmLabel}
      cancelText={cancelLabel}
      okButtonProps={{ danger: true, loading: isConfirming }}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      <p>{children}</p>
      {errorMessage === undefined ? null : <ErrorBanner message={errorMessage} />}
    </Modal>
  )
}
