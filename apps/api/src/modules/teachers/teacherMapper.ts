import type { Teacher } from "@school-portal/contract"
import type { TeacherRecord } from "./teacherRepository.ts"

export function toTeacher(record: TeacherRecord): Teacher {
  return {
    name: record.name,
    subject: record.subject,
    email: record.email,
    contactNumber: record.contactNumber,
  }
}
