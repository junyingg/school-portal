import type { ReactNode } from "react"
import styles from "./EmptyState.module.css"

interface EmptyStateProps {
  readonly message: string
  readonly action?: ReactNode | undefined
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className={styles["empty"]}>
      <p className={styles["message"]}>{message}</p>
      {action}
    </div>
  )
}
