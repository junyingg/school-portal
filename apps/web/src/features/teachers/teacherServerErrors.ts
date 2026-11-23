import { TEACHER_EMAIL_TAKEN_MESSAGE } from "@school-portal/contract"
import { ApiError } from "../../api/ApiError.ts"
import { bannerFor, type ServerErrorPresentation } from "../serverErrorPresentation.ts"
import { TEACHER_FIELD_MESSAGES } from "./teacherFieldMessages.ts"
import type { TeacherFieldName } from "./teacherFormSchema.ts"

export function presentTeacherServerError(
  error: unknown,
): ServerErrorPresentation<TeacherFieldName> {
  if (error instanceof ApiError && error.message === TEACHER_EMAIL_TAKEN_MESSAGE) {
    return { kind: "field", field: "email", message: TEACHER_FIELD_MESSAGES.emailTaken }
  }
  return bannerFor(error)
}
