import type { CreateTeacherRequest } from "@school-portal/contract"
import type { Kysely } from "kysely"
import type { Database } from "../../db/database.ts"

export interface TeacherRecord {
  readonly id: number
  readonly name: string
  readonly subject: string
  readonly email: string
  readonly contactNumber: string
}

export interface TeacherRepository {
  insert(teacher: CreateTeacherRequest): Promise<TeacherRecord>
}

const TEACHER_COLUMNS = [
  "id",
  "name",
  "subject",
  "email",
  "contact_number as contactNumber",
] as const

export function createTeacherRepository(db: Kysely<Database>): TeacherRepository {
  return {
    insert(teacher) {
      return db
        .insertInto("teachers")
        .values({
          name: teacher.name,
          subject: teacher.subject,
          email: teacher.email,
          contact_number: teacher.contactNumber,
        })
        .returning(TEACHER_COLUMNS)
        .executeTakeFirstOrThrow()
    },
  }
}
