import type { Kysely } from "kysely"
import type { Database } from "./db/database.ts"
import { createClassRepository } from "./modules/classes/classRepository.ts"
import { createClassService, type ClassService } from "./modules/classes/classService.ts"
import { createTeacherRepository } from "./modules/teachers/teacherRepository.ts"
import { createTeacherService, type TeacherService } from "./modules/teachers/teacherService.ts"

export interface AppServices {
  readonly teacherService: TeacherService
  readonly classService: ClassService
}

export function createServices(db: Kysely<Database>): AppServices {
  const teacherRepository = createTeacherRepository(db)
  const classRepository = createClassRepository(db)
  return {
    teacherService: createTeacherService({ teacherRepository }),
    classService: createClassService({ classRepository, teacherRepository }),
  }
}
