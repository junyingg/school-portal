import type { CreateTeacherRequest, Teacher } from "@school-portal/contract"
import { TeacherNotFoundError } from "../../errors/domainErrors.ts"
import { toTeacher } from "./teacherMapper.ts"
import type { TeacherRepository } from "./teacherRepository.ts"

export interface TeacherService {
  registerTeacher(request: CreateTeacherRequest): Promise<Teacher>
  listTeachers(): Promise<Teacher[]>
  deleteTeacher(email: string): Promise<void>
}

export interface TeacherServiceDependencies {
  readonly teacherRepository: TeacherRepository
}

export function createTeacherService({
  teacherRepository,
}: TeacherServiceDependencies): TeacherService {
  return {
    async registerTeacher(request) {
      const record = await teacherRepository.insert(request)
      return toTeacher(record)
    },

    async listTeachers() {
      const records = await teacherRepository.listInInsertionOrder()
      return records.map(toTeacher)
    },

    async deleteTeacher(email) {
      const wasDeleted = await teacherRepository.deleteByEmail(email)
      if (!wasDeleted) {
        throw new TeacherNotFoundError(email)
      }
    },
  }
}
