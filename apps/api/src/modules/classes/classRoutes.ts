import {
  classListResponseSchema,
  classPathParamsSchema,
  createClassRequestSchema,
  schoolClassSchema,
} from "@school-portal/contract"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import {
  CLASS_DELETE_ERROR_RESPONSES,
  READ_ERROR_RESPONSES,
  WRITE_ERROR_RESPONSES,
} from "../../http/apiErrorResponses.ts"
import { registerMethodNotAllowed } from "../../http/methodNotAllowed.ts"
import type { ClassHandlers } from "./classHandlers.ts"

export const CLASSES_PATH = "/api/classes"
export const CLASS_PATH = "/api/classes/:teacherEmail"

export function createClassRoutes(handlers: ClassHandlers): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      CLASSES_PATH,
      {
        schema: {
          summary: "Add a class with its form teacher",
          body: createClassRequestSchema,
          response: { 201: schoolClassSchema, ...WRITE_ERROR_RESPONSES },
        },
      },
      handlers.addClass,
    )
    app.get(
      CLASSES_PATH,
      {
        schema: {
          summary: "List classes in the order they were added",
          response: { 200: classListResponseSchema, ...READ_ERROR_RESPONSES },
        },
      },
      handlers.listClasses,
    )
    app.delete(
      CLASS_PATH,
      {
        schema: {
          summary: "Delete the class whose form teacher has this email",
          params: classPathParamsSchema,
          response: { 204: z.null(), ...CLASS_DELETE_ERROR_RESPONSES },
        },
      },
      handlers.deleteClass,
    )
    registerMethodNotAllowed(app, CLASSES_PATH, ["GET", "POST"])
    registerMethodNotAllowed(app, CLASS_PATH, ["DELETE"])
    done()
  }
}
