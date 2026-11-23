import type { CreateTeacherRequest } from "@school-portal/contract"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { TeacherService } from "./teacherService.ts"

const HTTP_CREATED = 201

export interface TeacherHandlers {
  readonly registerTeacher: (
    request: FastifyRequest<{ Body: CreateTeacherRequest }>,
    reply: FastifyReply,
  ) => Promise<void>
}

export function createTeacherHandlers(teacherService: TeacherService): TeacherHandlers {
  return {
    async registerTeacher(request, reply) {
      const teacher = await teacherService.registerTeacher(request.body)
      await reply.status(HTTP_CREATED).send(teacher)
    },
  }
}
