import {
  classListResponseSchema,
  createClassRequestSchema,
  schoolClassSchema,
} from "@school-portal/contract"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { registerMethodNotAllowed } from "../../http/methodNotAllowed.ts"
import type { ClassHandlers } from "./classHandlers.ts"

export const CLASSES_PATH = "/api/classes"

export function createClassRoutes(handlers: ClassHandlers): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.post(
      CLASSES_PATH,
      { schema: { body: createClassRequestSchema, response: { 201: schoolClassSchema } } },
      handlers.addClass,
    )
    app.get(
      CLASSES_PATH,
      { schema: { response: { 200: classListResponseSchema } } },
      handlers.listClasses,
    )
    registerMethodNotAllowed(app, CLASSES_PATH, ["GET", "POST"])
    done()
  }
}
