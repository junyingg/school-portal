export {
  BODY_TOO_LARGE_MESSAGE,
  CONTENT_LENGTH_MISMATCH_MESSAGE,
  FORM_TEACHER_TAKEN_MESSAGE,
  INTERNAL_ERROR_MESSAGE,
  INVALID_JSON_MESSAGE,
  METHOD_NOT_ALLOWED_MESSAGE,
  NOT_AN_OBJECT_MESSAGE,
  NOT_FOUND_MESSAGE,
  RESOURCE_EXISTS_MESSAGE,
  TEACHER_EMAIL_TAKEN_MESSAGE,
  UNSUPPORTED_MEDIA_TYPE_MESSAGE,
  unknownTeacherEmailMessage,
} from "./errorMessages.ts"
export {
  SPEC_CLASSES,
  SPEC_CREATE_CLASS_REQUEST,
  SPEC_CREATE_TEACHER_REQUEST,
  SPEC_TEACHERS,
} from "./examples.ts"
export {
  CLASS_NAME_MAX_LENGTH,
  CONTACT_NUMBER_MESSAGE,
  CONTACT_NUMBER_PATTERN,
  CONTROL_CHARACTER_PATTERN,
  EMAIL_MAX_LENGTH,
  LEVEL_NOT_LISTED_MESSAGE,
  NAME_MAX_LENGTH,
  SIMPLE_EMAIL_PATTERN,
  SUBJECT_NOT_LISTED_MESSAGE,
} from "./fieldRules.ts"
export { CLASS_LEVELS, SUBJECTS, type ClassLevel, type Subject } from "./optionLists.ts"
export {
  classListResponseSchema,
  createClassRequestSchema,
  formTeacherSchema,
  schoolClassSchema,
  type ClassListResponse,
  type CreateClassRequest,
  type FormTeacher,
  type SchoolClass,
} from "./schoolClass.ts"
export {
  createTeacherRequestSchema,
  teacherListResponseSchema,
  teacherSchema,
  type CreateTeacherRequest,
  type Teacher,
  type TeacherListResponse,
} from "./teacher.ts"
