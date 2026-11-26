import type { Kysely } from "kysely"
import type { Database } from "../../db/database.ts"
import { teacherHasEmail } from "../../db/teacherEmail.ts"

export interface NewClass {
  readonly level: string
  readonly name: string
  readonly formTeacherId: number
}

export interface ClassWithFormTeacherRecord {
  readonly level: string
  readonly name: string
  readonly formTeacherName: string
  readonly formTeacherEmail: string
}

export interface ClassRepository {
  insert(schoolClass: NewClass): Promise<void>
  listInInsertionOrder(): Promise<ClassWithFormTeacherRecord[]>
  deleteByFormTeacherEmail(email: string): Promise<boolean>
}

export function createClassRepository(db: Kysely<Database>): ClassRepository {
  return {
    async insert(schoolClass) {
      await db
        .insertInto("classes")
        .values({
          level: schoolClass.level,
          name: schoolClass.name,
          form_teacher_id: schoolClass.formTeacherId,
        })
        .execute()
    },

    listInInsertionOrder() {
      return db
        .selectFrom("classes")
        .innerJoin("teachers", "teachers.id", "classes.form_teacher_id")
        .select([
          "classes.level as level",
          "classes.name as name",
          "teachers.name as formTeacherName",
          "teachers.email as formTeacherEmail",
        ])
        .orderBy("classes.id")
        .execute()
    },

    async deleteByFormTeacherEmail(email) {
      const result = await db
        .deleteFrom("classes")
        .where("form_teacher_id", "in", (eb) =>
          eb.selectFrom("teachers").select("id").where(teacherHasEmail(email)),
        )
        .executeTakeFirst()
      return result.numDeletedRows > 0n
    },
  }
}
