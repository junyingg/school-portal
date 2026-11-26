import type { Teacher } from "@school-portal/contract"

export const TEACHER_DELETE_COPY = {
  title: "Delete teacher?",
  confirm: "Delete",
  cancel: "Cancel",
  formTeacher: "This teacher is the form teacher of a class. Delete the class first.",
  alreadyDeleted: "This teacher has already been deleted.",
} as const

export function teacherDeleteQuestion(teacher: Teacher): string {
  return `Delete ${teacher.name} (${teacher.email})? This cannot be undone.`
}
