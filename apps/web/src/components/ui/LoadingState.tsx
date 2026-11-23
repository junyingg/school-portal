import { Spin } from "antd"
import styles from "./LoadingState.module.css"

interface LoadingStateProps {
  readonly message: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className={styles["loading"]} role="status">
      <Spin aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
