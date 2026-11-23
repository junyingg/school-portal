import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH } from "@school-portal/contract"

export const TEACHER_FIELD_LABELS = {
  name: "Name",
  subject: "Subject",
  email: "Email Address",
  contactNumber: "Work Contact Number",
} as const

export const TEACHER_FIELD_PLACEHOLDERS = {
  name: "Name",
  subject: "Select a subject",
  email: "Email address",
  contactNumber: "Work contact number",
} as const

export const TEACHER_FIELD_MESSAGES = {
  nameRequired: "This name is required.",
  nameTooLong: `This name must be at most ${NAME_MAX_LENGTH} characters.`,
  nameHasControlCharacters: "This name must not contain control characters.",
  subjectRequired: "This subject is required.",
  subjectInvalid: "This subject is invalid.",
  emailRequired: "This email address is required.",
  emailInvalid: "This email address is invalid.",
  emailTooLong: `This email address must be at most ${EMAIL_MAX_LENGTH} characters.`,
  emailTaken: "This email address is already registered.",
  contactNumberRequired: "This work contact number is required.",
  contactNumberInvalid: "This work contact number is invalid.",
} as const
