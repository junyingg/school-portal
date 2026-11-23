import { useNavigate } from "react-router"
import { ListPage, type ListPageCopy } from "../components/ListPage.tsx"
import { TeacherTable } from "../features/teachers/TeacherTable.tsx"
import { useTeachers } from "../features/teachers/useTeachers.ts"
import { ROUTES } from "../routePaths.ts"

const TEACHERS_COPY: ListPageCopy = {
  title: "Teachers",
  addLabel: "Add Teacher",
  loadingMessage: "Loading teachers…",
  emptyMessage: "There are no existing teachers yet.",
  loadErrorMessage: "We could not load the teachers.",
}

export function TeachersPage() {
  const teachers = useTeachers()
  const navigate = useNavigate()

  return (
    <ListPage
      copy={TEACHERS_COPY}
      query={teachers}
      onAdd={() => {
        void navigate(ROUTES.newTeacher)
      }}
      renderList={(items) => <TeacherTable teachers={items} />}
    />
  )
}
