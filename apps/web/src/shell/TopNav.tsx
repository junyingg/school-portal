import { useLocation } from "react-router"
import { GraduationCapIcon } from "../components/ui/index.ts"
import { ROUTES } from "../routePaths.ts"
import { activeTabFor, type TabId } from "./activeTab.ts"
import { NavTab } from "./NavTab.tsx"
import styles from "./TopNav.module.css"

interface Tab {
  readonly id: TabId
  readonly label: string
  readonly to: string
}

const TABS: readonly Tab[] = [
  { id: "classes", label: "Classes", to: ROUTES.classes },
  { id: "teachers", label: "Teachers", to: ROUTES.teachers },
]

export function TopNav() {
  const { pathname } = useLocation()
  const currentTab = activeTabFor(pathname)

  return (
    <header className={styles["bar"]}>
      <span className={styles["brand"]}>
        <GraduationCapIcon />
        <span>School Portal</span>
      </span>
      <nav aria-label="Main" className={styles["tabs"]}>
        {TABS.map((tab) => (
          <NavTab key={tab.id} to={tab.to} label={tab.label} isCurrent={tab.id === currentTab} />
        ))}
      </nav>
    </header>
  )
}
