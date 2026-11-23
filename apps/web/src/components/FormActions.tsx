import styles from "./FormActions.module.css"
import { BackIcon, Button } from "./ui/index.ts"

export const SUBMITTING_LABEL = "Adding..."

interface FormActionsProps {
  readonly submitLabel: string
  readonly isSubmitting: boolean
  readonly onBack: () => void
}

export function FormActions({ submitLabel, isSubmitting, onBack }: FormActionsProps) {
  return (
    <div className={styles["actions"]}>
      <Button variant="outlined" icon={<BackIcon />} onClick={onBack}>
        Back
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? SUBMITTING_LABEL : submitLabel}
      </Button>
    </div>
  )
}
