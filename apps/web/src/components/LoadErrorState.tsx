import { Button } from "./ui/index.ts"
import styles from "./EmptyState.module.css"

interface LoadErrorStateProps {
  readonly message: string
  readonly onRetry: () => void
}

export function LoadErrorState({ message, onRetry }: LoadErrorStateProps) {
  return (
    <div className={styles["empty"]} role="alert">
      <p className={styles["message"]}>{message}</p>
      <Button variant="outlined" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
