import {
  createTeacherRequestSchema,
  teacherListResponseSchema,
  teacherSchema,
} from "@school-portal/contract"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { READ_ERROR_RESPONSES, WRITE_ERROR_RESPONSES } from "../../http/apiErrorResponses.ts"
import { registerMethodNotAllowed } from "../../http/methodNotAllowed.ts"
import type { TeacherHandlers } from "./teacherHandlers.ts"

export const TEACHERS_PATH = "/api/teachers"

export function createTeacherRoutes(handlers: TeacherHandlers): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      TEACHERS_PATH,
      {
        schema: {
          summary: "Register a teacher",
          body: createTeacherRequestSchema,
          response: { 201: teacherSchema, ...WRITE_ERROR_RESPONSES },
        },
      },
      handlers.registerTeacher,
    )
    app.get(
      TEACHERS_PATH,
      {
        schema: {
          summary: "List teachers in the order they were registered",
          response: { 200: teacherListResponseSchema, ...READ_ERROR_RESPONSES },
        },
      },
      handlers.listTeachers,
    )
    registerMethodNotAllowed(app, TEACHERS_PATH, ["GET", "POST"])
    done()
  }
}
