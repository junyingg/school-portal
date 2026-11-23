import { CLASS_NAME_MAX_LENGTH } from "@school-portal/contract"

export const CLASS_FIELD_LABELS = {
  level: "Class Level",
  name: "Class Name",
  teacherEmail: "Form Teacher",
} as const

export const CLASS_FIELD_PLACEHOLDERS = {
  level: "Select a level",
  name: "Class Name",
  teacherEmail: "Assign a form teacher",
} as const

export const CLASS_FIELD_MESSAGES = {
  levelRequired: "This class level is required.",
  levelInvalid: "This class level is invalid.",
  nameRequired: "This class name is required.",
  nameTooLong: `This class name must be at most ${CLASS_NAME_MAX_LENGTH} characters.`,
  formTeacherRequired: "This form teacher is required.",
} as const

export const FORM_TEACHER_COPY = {
  noTeachers: "No existing teachers.",
  addTeacher: "Add a teacher",
  loadFailed: "We could not load the teachers.",
} as const
