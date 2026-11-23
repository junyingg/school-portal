import type { CreateClassRequest, SchoolClass } from "./schoolClass.ts"
import type { CreateTeacherRequest, Teacher } from "./teacher.ts"

export const SPEC_TEACHERS = [
  {
    name: "Mary",
    subject: "Mathematics",
    email: "teachermary@gmail.com",
    contactNumber: "68129414",
  },
  {
    name: "Ken",
    subject: "Mother Tongue Language",
    email: "teacherken@gmail.com",
    contactNumber: "61824191",
  },
] as const satisfies readonly Teacher[]

export const SPEC_CLASSES = [
  { level: "Primary 1", name: "Class 1A", formTeacher: { name: "Mary" } },
  { level: "Primary 2", name: "Class 2B", formTeacher: { name: "Ken" } },
] as const satisfies readonly SchoolClass[]

export const SPEC_CREATE_TEACHER_REQUEST: CreateTeacherRequest = SPEC_TEACHERS[0]

export const SPEC_CREATE_CLASS_REQUEST = {
  level: "Primary 1",
  name: "Class 1A",
  teacherEmail: "teachermary@gmail.com",
} as const satisfies CreateClassRequest
