import type { CreateTeacherRequest } from "@school-portal/contract"

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
