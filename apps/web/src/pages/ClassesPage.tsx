import type { SchoolClass } from "@school-portal/contract"
import { useState } from "react"
import { useNavigate } from "react-router"
import { ListPage, type ListPageCopy } from "../components/ListPage.tsx"
import { ClassTable } from "../features/classes/ClassTable.tsx"
import { DeleteClassDialog } from "../features/classes/DeleteClassDialog.tsx"
import { useClasses } from "../features/classes/useClasses.ts"
import { ROUTES } from "../routePaths.ts"

const CLASSES_COPY: ListPageCopy = {
  title: "Classes",
  addLabel: "Add Class",
  loadingMessage: "Loading classes…",
  emptyMessage: "There are no existing classes yet.",
  loadErrorMessage: "We could not load the classes.",
}

export function ClassesPage() {
  const classes = useClasses()
  const navigate = useNavigate()
  const [classToDelete, setClassToDelete] = useState<SchoolClass | undefined>(undefined)

  return (
    <>
      <ListPage
        copy={CLASSES_COPY}
        query={classes}
        onAdd={() => {
          void navigate(ROUTES.newClass)
        }}
        renderList={(items) => <ClassTable classes={items} onDelete={setClassToDelete} />}
      />
      {classToDelete === undefined ? null : (
        <DeleteClassDialog
          key={classToDelete.formTeacher.email}
          schoolClass={classToDelete}
          onClose={() => {
            setClassToDelete(undefined)
          }}
        />
      )}
    </>
  )
}
