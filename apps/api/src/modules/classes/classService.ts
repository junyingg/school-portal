import type { CreateClassRequest, SchoolClass } from "@school-portal/contract"
import { ClassNotFoundError, UnknownTeacherEmailError } from "../../errors/domainErrors.ts"
import type { TeacherRepository } from "../teachers/teacherRepository.ts"
import { toSchoolClass } from "./classMapper.ts"
import type { ClassRepository } from "./classRepository.ts"

export interface ClassService {
  addClass(request: CreateClassRequest): Promise<SchoolClass>
  listClasses(): Promise<SchoolClass[]>
  deleteClass(teacherEmail: string): Promise<void>
}

export interface ClassServiceDependencies {
  readonly classRepository: ClassRepository
  readonly teacherRepository: TeacherRepository
}

export function createClassService({
  classRepository,
  teacherRepository,
}: ClassServiceDependencies): ClassService {
  return {
    async addClass(request) {
      const formTeacher = await teacherRepository.findByEmail(request.teacherEmail)
      if (formTeacher === undefined) {
        throw new UnknownTeacherEmailError(request.teacherEmail)
      }

      await classRepository.insert({
        level: request.level,
        name: request.name,
        formTeacherId: formTeacher.id,
      })
      return toSchoolClass({
        level: request.level,
        name: request.name,
        formTeacherName: formTeacher.name,
        formTeacherEmail: formTeacher.email,
      })
    },

    async listClasses() {
      const records = await classRepository.listInInsertionOrder()
      return records.map(toSchoolClass)
    },

    async deleteClass(teacherEmail) {
      const wasDeleted = await classRepository.deleteByFormTeacherEmail(teacherEmail)
      if (!wasDeleted) {
        throw new ClassNotFoundError(teacherEmail)
      }
    },
  }
}
