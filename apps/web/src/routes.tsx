import { Navigate, Route, Routes } from "react-router"
import { AddClassPage } from "./pages/AddClassPage.tsx"
import { AddTeacherPage } from "./pages/AddTeacherPage.tsx"
import { ClassesPage } from "./pages/ClassesPage.tsx"
import { NotFoundPage } from "./pages/NotFoundPage.tsx"
import { TeachersPage } from "./pages/TeachersPage.tsx"
import { ROUTES } from "./routePaths.ts"
import { AppLayout } from "./shell/AppLayout.tsx"

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={ROUTES.classes} replace />} />
        <Route path={ROUTES.classes} element={<ClassesPage />} />
        <Route path={ROUTES.newClass} element={<AddClassPage />} />
        <Route path={ROUTES.teachers} element={<TeachersPage />} />
        <Route path={ROUTES.newTeacher} element={<AddTeacherPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
