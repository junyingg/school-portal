import {
  classListResponseSchema,
  createClassRequestSchema,
  schoolClassSchema,
} from "@school-portal/contract"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { READ_ERROR_RESPONSES, WRITE_ERROR_RESPONSES } from "../../http/apiErrorResponses.ts"
import { registerMethodNotAllowed } from "../../http/methodNotAllowed.ts"
import type { ClassHandlers } from "./classHandlers.ts"

export const CLASSES_PATH = "/api/classes"

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
    registerMethodNotAllowed(app, CLASSES_PATH, ["GET", "POST"])
    done()
  }
}
