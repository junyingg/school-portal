import type { Teacher } from "@school-portal/contract"
import { Button, DataTable, type DataColumn } from "../../components/ui/index.ts"
import { formatContactNumber } from "./formatContactNumber.ts"
import { TEACHER_DELETE_COPY } from "./teacherDeleteCopy.ts"

const DESIGN_COLUMNS: readonly DataColumn<Teacher>[] = [
  { key: "position", title: "#", width: 56, render: (_teacher, position) => position },
  { key: "name", title: "Name", render: (teacher) => teacher.name },
  { key: "subject", title: "Subject", render: (teacher) => teacher.subject },
  { key: "email", title: "Email", render: (teacher) => teacher.email },
  {
    key: "contactNumber",
    title: "Work Contact",
    render: (teacher) => formatContactNumber(teacher.contactNumber),
  },
]

interface TeacherTableProps {
  readonly teachers: readonly Teacher[]
  readonly onDelete: (teacher: Teacher) => void
}

function actionsColumn(onDelete: (teacher: Teacher) => void): DataColumn<Teacher> {
  return {
    key: "actions",
    title: "Actions",
    render: (teacher) => (
      <Button
        variant="danger"
        accessibleName={`${TEACHER_DELETE_COPY.confirm} ${teacher.name}`}
        onClick={() => {
          onDelete(teacher)
        }}
      >
        {TEACHER_DELETE_COPY.confirm}
      </Button>
    ),
  }
}

export function TeacherTable({ teachers, onDelete }: TeacherTableProps) {
  return (
    <DataTable
      label="Teachers"
      columns={[...DESIGN_COLUMNS, actionsColumn(onDelete)]}
      rows={teachers}
    />
  )
}
