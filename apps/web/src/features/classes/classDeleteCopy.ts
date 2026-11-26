import type { SchoolClass } from "@school-portal/contract"

export const CLASS_DELETE_COPY = {
  title: "Delete class?",
  confirm: "Delete",
  cancel: "Cancel",
  alreadyDeleted: "This class has already been deleted.",
} as const

export function classDeleteQuestion(schoolClass: SchoolClass): string {
  return `Delete ${schoolClass.name} (${schoolClass.level}, form teacher ${schoolClass.formTeacher.name})? This cannot be undone.`
}
