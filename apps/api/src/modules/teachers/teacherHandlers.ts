import type { CreateTeacherRequest, TeacherListResponse } from "@school-portal/contract"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { TeacherService } from "./teacherService.ts"

const HTTP_CREATED = 201

export interface TeacherHandlers {
  readonly registerTeacher: (
    request: FastifyRequest<{ Body: CreateTeacherRequest }>,
    reply: FastifyReply,
  ) => Promise<void>
  readonly listTeachers: () => Promise<TeacherListResponse>
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
  }
}
