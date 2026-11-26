import type { CreateTeacherRequest } from "@school-portal/contract"
import type { Kysely } from "kysely"
import { CLASSES_FORM_TEACHER_ID_FKEY } from "../../db/constraintNames.ts"
import type { Database } from "../../db/database.ts"
import { teacherHasEmail } from "../../db/teacherEmail.ts"
import { TeacherIsFormTeacherError } from "../../errors/domainErrors.ts"
import { isRestrictViolationOn } from "../../errors/postgresErrors.ts"

export interface TeacherRecord {
  readonly id: number
  readonly name: string
  readonly subject: string
  readonly email: string
  readonly contactNumber: string
}

export interface TeacherRepository {
  insert(teacher: CreateTeacherRequest): Promise<TeacherRecord>
  listInInsertionOrder(): Promise<TeacherRecord[]>
  findByEmail(email: string): Promise<TeacherRecord | undefined>
  deleteByEmail(email: string): Promise<boolean>
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

    listInInsertionOrder() {
      return db.selectFrom("teachers").select(TEACHER_COLUMNS).orderBy("id").execute()
    },

    findByEmail(email) {
      return db
        .selectFrom("teachers")
        .select(TEACHER_COLUMNS)
        .where(teacherHasEmail(email))
        .executeTakeFirst()
    },

    async deleteByEmail(email) {
      try {
        const result = await db
          .deleteFrom("teachers")
          .where(teacherHasEmail(email))
          .executeTakeFirst()
        return result.numDeletedRows > 0n
      } catch (error) {
        if (isRestrictViolationOn(error, CLASSES_FORM_TEACHER_ID_FKEY)) {
          throw new TeacherIsFormTeacherError(email)
        }
        throw error
      }
    },
  }
}
