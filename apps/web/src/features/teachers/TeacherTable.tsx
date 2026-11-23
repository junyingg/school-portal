import type { Teacher } from "@school-portal/contract"
import { DataTable, type DataColumn } from "../../components/ui/index.ts"
import { formatContactNumber } from "./formatContactNumber.ts"

const TEACHER_COLUMNS: readonly DataColumn<Teacher>[] = [
  { key: "position", title: "#", render: (_teacher, position) => position },
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
}

export function TeacherTable({ teachers }: TeacherTableProps) {
  return <DataTable label="Teachers" columns={TEACHER_COLUMNS} rows={teachers} />
}
