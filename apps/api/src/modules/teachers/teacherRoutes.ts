import {
  createTeacherRequestSchema,
  teacherListResponseSchema,
  teacherSchema,
} from "@school-portal/contract"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { registerMethodNotAllowed } from "../../http/methodNotAllowed.ts"
import type { TeacherHandlers } from "./teacherHandlers.ts"

export const TEACHERS_PATH = "/api/teachers"

export function createTeacherRoutes(handlers: TeacherHandlers): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      TEACHERS_PATH,
      { schema: { body: createTeacherRequestSchema, response: { 201: teacherSchema } } },
      handlers.registerTeacher,
    )
    app.get(
      TEACHERS_PATH,
      { schema: { response: { 200: teacherListResponseSchema } } },
      handlers.listTeachers,
    )
    registerMethodNotAllowed(app, TEACHERS_PATH, ["GET", "POST"])
    done()
  }
}
