import type { Kysely } from "kysely"
import type { Database } from "./db/database.ts"
import { createTeacherRepository } from "./modules/teachers/teacherRepository.ts"
import { createTeacherService, type TeacherService } from "./modules/teachers/teacherService.ts"

export interface AppServices {
  readonly teacherService: TeacherService
}

export function createServices(db: Kysely<Database>): AppServices {
  const teacherRepository = createTeacherRepository(db)
  return {
    teacherService: createTeacherService({ teacherRepository }),
  }
}
