export const NOT_FOUND_MESSAGE = "Not found"
export const INTERNAL_ERROR_MESSAGE = "Internal server error"
export const INVALID_JSON_MESSAGE = "Request body must be valid JSON"
export const NOT_AN_OBJECT_MESSAGE = "Request body must be a JSON object"
export const UNSUPPORTED_MEDIA_TYPE_MESSAGE = "Content-Type must be application/json"
export const BODY_TOO_LARGE_MESSAGE = "Request body too large"
export const CONTENT_LENGTH_MISMATCH_MESSAGE = "Request body size did not match Content-Length"
export const TEACHER_EMAIL_TAKEN_MESSAGE = "A teacher with this email already exists"
export const RESOURCE_EXISTS_MESSAGE = "Resource already exists"
export const FORM_TEACHER_TAKEN_MESSAGE = "Teacher is already the form teacher of another class"
export const TEACHER_IS_FORM_TEACHER_MESSAGE =
  "Teacher is the form teacher of a class and cannot be deleted"

export function unknownTeacherEmailMessage(email: string): string {
  return `No teacher found with email ${email}`
}
export const METHOD_NOT_ALLOWED_MESSAGE = "Method not allowed"
export const SERVICE_UNAVAILABLE_MESSAGE = "Service unavailable"

export function noClassForTeacherMessage(teacherEmail: string): string {
  return `No class found with form teacher email ${teacherEmail}`
}
