import type {
  CreateTeacherRequest,
  TeacherListResponse,
  TeacherPathParams,
} from "@school-portal/contract"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { TeacherService } from "./teacherService.ts"

const HTTP_CREATED = 201
const HTTP_NO_CONTENT = 204

export interface TeacherHandlers {
  readonly registerTeacher: (
    request: FastifyRequest<{ Body: CreateTeacherRequest }>,
    reply: FastifyReply,
  ) => Promise<void>
  readonly listTeachers: () => Promise<TeacherListResponse>
  readonly deleteTeacher: (
    request: FastifyRequest<{ Params: TeacherPathParams }>,
    reply: FastifyReply,
  ) => Promise<void>
}

export function createTeacherHandlers(teacherService: TeacherService): TeacherHandlers {
  return {
    async registerTeacher(request, reply) {
      const teacher = await teacherService.registerTeacher(request.body)
      await reply.status(HTTP_CREATED).send(teacher)
    },

    async listTeachers() {
      const teachers = await teacherService.listTeachers()
      return { data: teachers }
    },

    async deleteTeacher(request, reply) {
      await teacherService.deleteTeacher(request.params.email)
      await reply.status(HTTP_NO_CONTENT).send()
    },
  }
}
