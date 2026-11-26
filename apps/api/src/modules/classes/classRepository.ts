import type { Kysely } from "kysely"
import type { Database } from "../../db/database.ts"

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
  }
}
