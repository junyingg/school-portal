import { unknownTeacherEmailMessage } from "@school-portal/contract"

export class UnknownTeacherEmailError extends Error {
  readonly email: string

  constructor(email: string) {
    super(unknownTeacherEmailMessage(email))
    this.name = "UnknownTeacherEmailError"
    this.email = email
  }
}
