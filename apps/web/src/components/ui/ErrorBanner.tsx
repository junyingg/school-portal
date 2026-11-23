import { Alert } from "antd"
import styles from "./ErrorBanner.module.css"

interface ErrorBannerProps {
  readonly message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className={styles["banner"]}>
      <Alert type="error" showIcon title={message} />
    </div>
  )
}
