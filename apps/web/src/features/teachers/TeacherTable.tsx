import type { Teacher } from "@school-portal/contract"
import { DataTable, DeleteIcon, IconButton, type DataColumn } from "../../components/ui/index.ts"
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

const ACTIONS_COLUMN_WIDTH = 72

interface TeacherTableProps {
  readonly teachers: readonly Teacher[]
  readonly onDelete: (teacher: Teacher) => void
}

function actionsColumn(onDelete: (teacher: Teacher) => void): DataColumn<Teacher> {
  return {
    key: "actions",
    title: "Actions",
    isTitleHidden: true,
    width: ACTIONS_COLUMN_WIDTH,
    render: (teacher) => (
      <IconButton
        icon={<DeleteIcon />}
        accessibleName={`${TEACHER_DELETE_COPY.confirm} ${teacher.name}`}
        tooltip={TEACHER_DELETE_COPY.confirm}
        isDanger
        onClick={() => {
          onDelete(teacher)
        }}
      />
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
