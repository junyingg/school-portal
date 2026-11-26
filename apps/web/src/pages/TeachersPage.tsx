import type { Teacher } from "@school-portal/contract"
import { useState } from "react"
import { useNavigate } from "react-router"
import { ListPage, type ListPageCopy } from "../components/ListPage.tsx"
import { DeleteTeacherDialog } from "../features/teachers/DeleteTeacherDialog.tsx"
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
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | undefined>(undefined)

  return (
    <>
      <ListPage
        copy={TEACHERS_COPY}
        query={teachers}
        onAdd={() => {
          void navigate(ROUTES.newTeacher)
        }}
        renderList={(items) => <TeacherTable teachers={items} onDelete={setTeacherToDelete} />}
      />
      {teacherToDelete === undefined ? null : (
        <DeleteTeacherDialog
          key={teacherToDelete.email}
          teacher={teacherToDelete}
          onClose={() => {
            setTeacherToDelete(undefined)
          }}
        />
      )}
    </>
  )
}
