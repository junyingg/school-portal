import type { Kysely } from "kysely"
import type { Database } from "../../db/database.ts"

export interface NewClass {
  readonly level: string
  readonly name: string
  readonly formTeacherId: number
}

export interface ClassRepository {
  insert(schoolClass: NewClass): Promise<void>
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
  }
}
