import type { ReactNode } from "react"
import styles from "./Card.module.css"

interface CardProps {
  readonly label: string
  readonly isBusy?: boolean
  readonly children: ReactNode
}

export function Card({ label, isBusy = false, children }: CardProps) {
  return (
    <section aria-label={label} aria-busy={isBusy} className={styles["card"]}>
      {children}
    </section>
  )
}
