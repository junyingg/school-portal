import type { CreateTeacherRequest, Teacher } from "@school-portal/contract"
import { toTeacher } from "./teacherMapper.ts"
import type { TeacherRepository } from "./teacherRepository.ts"

export interface TeacherService {
  registerTeacher(request: CreateTeacherRequest): Promise<Teacher>
  listTeachers(): Promise<Teacher[]>
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
  }
}
