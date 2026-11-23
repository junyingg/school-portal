import { Outlet } from "react-router"
import styles from "./AppLayout.module.css"
import { TopNav } from "./TopNav.tsx"

export function AppLayout() {
  return (
    <div className={styles["page"]}>
      <TopNav />
      <main className={styles["content"]}>
        <Outlet />
      </main>
    </div>
  )
}
