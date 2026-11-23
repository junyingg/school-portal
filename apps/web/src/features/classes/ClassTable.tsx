import type { SchoolClass } from "@school-portal/contract"
import { DataTable, type DataColumn } from "../../components/ui/index.ts"

const CLASS_COLUMNS: readonly DataColumn<SchoolClass>[] = [
  { key: "position", title: "#", render: (_schoolClass, position) => position },
  { key: "level", title: "Class Level", render: (schoolClass) => schoolClass.level },
  { key: "name", title: "Class Name", render: (schoolClass) => schoolClass.name },
  {
    key: "formTeacher",
    title: "Form Teacher",
    render: (schoolClass) => schoolClass.formTeacher.name,
  },
]

interface ClassTableProps {
  readonly classes: readonly SchoolClass[]
}

export function ClassTable({ classes }: ClassTableProps) {
  return <DataTable label="Classes" columns={CLASS_COLUMNS} rows={classes} />
}
