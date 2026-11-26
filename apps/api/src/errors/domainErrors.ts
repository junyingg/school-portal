import {
  TEACHER_IS_FORM_TEACHER_MESSAGE,
  noClassForTeacherMessage,
  unknownTeacherEmailMessage,
} from "@school-portal/contract"

export class UnknownTeacherEmailError extends Error {
  readonly email: string

  constructor(email: string) {
    super(unknownTeacherEmailMessage(email))
    this.name = "UnknownTeacherEmailError"
    this.email = email
  }
}

export class TeacherNotFoundError extends Error {
  readonly email: string

  constructor(email: string) {
    super(unknownTeacherEmailMessage(email))
    this.name = "TeacherNotFoundError"
    this.email = email
  }
}

export class TeacherIsFormTeacherError extends Error {
  readonly email: string

  constructor(email: string) {
    super(TEACHER_IS_FORM_TEACHER_MESSAGE)
    this.name = "TeacherIsFormTeacherError"
    this.email = email
  }
}

export class ClassNotFoundError extends Error {
  readonly email: string

  constructor(email: string) {
    super(noClassForTeacherMessage(email))
    this.name = "ClassNotFoundError"
    this.email = email
  }
}
