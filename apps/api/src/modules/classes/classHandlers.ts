import type { CreateClassRequest } from "@school-portal/contract"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { ClassService } from "./classService.ts"

const HTTP_CREATED = 201

export interface ClassHandlers {
  readonly addClass: (
    request: FastifyRequest<{ Body: CreateClassRequest }>,
    reply: FastifyReply,
  ) => Promise<void>
}

export function createClassHandlers(classService: ClassService): ClassHandlers {
  return {
    async addClass(request, reply) {
      const schoolClass = await classService.addClass(request.body)
      await reply.status(HTTP_CREATED).send(schoolClass)
    },
  }
}
