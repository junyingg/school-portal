import { Link } from "react-router"
import styles from "./NavTab.module.css"

interface NavTabProps {
  readonly to: string
  readonly label: string
  readonly isCurrent: boolean
}

export function NavTab({ to, label, isCurrent }: NavTabProps) {
  return (
    <Link to={to} className={styles["tab"]} aria-current={isCurrent ? "page" : undefined}>
      {label}
    </Link>
  )
}
