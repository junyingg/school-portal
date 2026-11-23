import type { ReactNode } from "react"
import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  readonly title: string
  readonly action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className={styles["header"]}>
      <h1 className={styles["title"]}>{title}</h1>
      {action}
    </div>
  )
}
