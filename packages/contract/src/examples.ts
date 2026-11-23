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

export const SPEC_CREATE_TEACHER_REQUEST: CreateTeacherRequest = SPEC_TEACHERS[0]
