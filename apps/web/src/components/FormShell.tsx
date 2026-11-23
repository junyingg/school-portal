import type { FormEventHandler, ReactNode } from "react"
import { FormActions } from "./FormActions.tsx"
import { Card, ErrorBanner, FormLayout } from "./ui/index.ts"

interface FormShellProps {
  readonly label: string
  readonly cardLabel: string
  readonly submitLabel: string
  readonly isSubmitting: boolean
  readonly bannerMessage: string | undefined
  readonly onSubmit: FormEventHandler<HTMLFormElement>
  readonly onBack: () => void
  readonly children: ReactNode
}

export function FormShell({
  label,
  cardLabel,
  submitLabel,
  isSubmitting,
  bannerMessage,
  onSubmit,
  onBack,
  children,
}: FormShellProps) {
  return (
    <FormLayout label={label} onSubmit={onSubmit}>
      <Card label={cardLabel}>{children}</Card>
      {bannerMessage === undefined ? null : <ErrorBanner message={bannerMessage} />}
      <FormActions submitLabel={submitLabel} isSubmitting={isSubmitting} onBack={onBack} />
    </FormLayout>
  )
}
