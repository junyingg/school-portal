import type { ReactNode } from "react"
import { useFocusHeadingOnNavigate } from "../hooks/useFocusHeadingOnNavigate.ts"
import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  readonly title: string
  readonly action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  const headingRef = useFocusHeadingOnNavigate()
  return (
    <div className={styles["header"]}>
      <h1 ref={headingRef} tabIndex={-1} className={styles["title"]}>
        {title}
      </h1>
      {action}
    </div>
  )
}
