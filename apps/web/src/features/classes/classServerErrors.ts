import {
  FORM_TEACHER_TAKEN_MESSAGE,
  noClassForTeacherMessage,
  unknownTeacherEmailMessage,
} from "@school-portal/contract"
import { ApiError } from "../../api/ApiError.ts"
import { bannerFor, type ServerErrorPresentation } from "../serverErrorPresentation.ts"
import { CLASS_DELETE_COPY } from "./classDeleteCopy.ts"
import type { ClassFieldName } from "./classFormSchema.ts"

export const CLASS_SERVER_ERROR_COPY = {
  formTeacherTaken: "This teacher is already the form teacher of another class.",
  formTeacherNotFound: "This form teacher could not be found.",
} as const

export function presentClassServerError(
  error: unknown,
  sentTeacherEmail: string | undefined,
): ServerErrorPresentation<ClassFieldName> {
  if (!(error instanceof ApiError)) {
    return bannerFor(error)
  }
  if (error.message === FORM_TEACHER_TAKEN_MESSAGE) {
    return {
      kind: "field",
      field: "teacherEmail",
      message: CLASS_SERVER_ERROR_COPY.formTeacherTaken,
    }
  }
  const isUnknownTeacher =
    sentTeacherEmail !== undefined && error.message === unknownTeacherEmailMessage(sentTeacherEmail)
  if (isUnknownTeacher) {
    return {
      kind: "field",
      field: "teacherEmail",
      message: CLASS_SERVER_ERROR_COPY.formTeacherNotFound,
    }
  }
  return bannerFor(error)
}

export function presentClassDeleteError(error: unknown, teacherEmail: string): string {
  if (error instanceof ApiError && error.message === noClassForTeacherMessage(teacherEmail)) {
    return CLASS_DELETE_COPY.alreadyDeleted
  }
  return bannerFor(error).message
}
