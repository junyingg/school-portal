import type { SchoolClass } from "@school-portal/contract"
import { Button, DataTable, type DataColumn } from "../../components/ui/index.ts"
import { CLASS_DELETE_COPY } from "./classDeleteCopy.ts"

const DESIGN_COLUMNS: readonly DataColumn<SchoolClass>[] = [
  { key: "position", title: "#", width: 56, render: (_schoolClass, position) => position },
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
  readonly onDelete: (schoolClass: SchoolClass) => void
}

function actionsColumn(onDelete: (schoolClass: SchoolClass) => void): DataColumn<SchoolClass> {
  return {
    key: "actions",
    title: "Actions",
    render: (schoolClass) => (
      <Button
        variant="danger"
        accessibleName={`${CLASS_DELETE_COPY.confirm} ${schoolClass.name}`}
        onClick={() => {
          onDelete(schoolClass)
        }}
      >
        {CLASS_DELETE_COPY.confirm}
      </Button>
    ),
  }
}

export function ClassTable({ classes, onDelete }: ClassTableProps) {
  return (
    <DataTable
      label="Classes"
      columns={[...DESIGN_COLUMNS, actionsColumn(onDelete)]}
      rows={classes}
    />
  )
}
