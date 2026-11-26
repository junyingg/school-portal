import type {
  ClassListResponse,
  ClassPathParams,
  CreateClassRequest,
} from "@school-portal/contract"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { ClassService } from "./classService.ts"

const HTTP_CREATED = 201
const HTTP_NO_CONTENT = 204

export interface ClassHandlers {
  readonly addClass: (
    request: FastifyRequest<{ Body: CreateClassRequest }>,
    reply: FastifyReply,
  ) => Promise<void>
  readonly listClasses: () => Promise<ClassListResponse>
  readonly deleteClass: (
    request: FastifyRequest<{ Params: ClassPathParams }>,
    reply: FastifyReply,
  ) => Promise<void>
}

export function createClassHandlers(classService: ClassService): ClassHandlers {
  return {
    async addClass(request, reply) {
      const schoolClass = await classService.addClass(request.body)
      await reply.status(HTTP_CREATED).send(schoolClass)
    },

    async listClasses() {
      const classes = await classService.listClasses()
      return { data: classes }
    },

    async deleteClass(request, reply) {
      await classService.deleteClass(request.params.teacherEmail)
      await reply.status(HTTP_NO_CONTENT).send()
    },
  }
}
