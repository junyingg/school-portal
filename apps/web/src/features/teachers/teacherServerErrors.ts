import {
  TEACHER_EMAIL_TAKEN_MESSAGE,
  TEACHER_IS_FORM_TEACHER_MESSAGE,
  unknownTeacherEmailMessage,
} from "@school-portal/contract"
import { ApiError } from "../../api/ApiError.ts"
import { bannerFor, type ServerErrorPresentation } from "../serverErrorPresentation.ts"
import { TEACHER_DELETE_COPY } from "./teacherDeleteCopy.ts"
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

export function presentTeacherDeleteError(error: unknown, email: string): string {
  if (error instanceof ApiError && error.message === TEACHER_IS_FORM_TEACHER_MESSAGE) {
    return TEACHER_DELETE_COPY.formTeacher
  }
  if (error instanceof ApiError && error.message === unknownTeacherEmailMessage(email)) {
    return TEACHER_DELETE_COPY.alreadyDeleted
  }
  return bannerFor(error).message
}
