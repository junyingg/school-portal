import type { SchoolClass } from "@school-portal/contract"
import type { ClassWithFormTeacherRecord } from "./classRepository.ts"

export function toSchoolClass(record: ClassWithFormTeacherRecord): SchoolClass {
  return {
    level: record.level,
    name: record.name,
    formTeacher: { name: record.formTeacherName, email: record.formTeacherEmail },
  }
}
