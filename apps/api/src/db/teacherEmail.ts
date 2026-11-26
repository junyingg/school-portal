import type { ExpressionBuilder } from "kysely"
import type { Database } from "./database.ts"

export function teacherHasEmail(email: string) {
  return (eb: ExpressionBuilder<Database, "teachers">) =>
    eb(eb.fn<string>("lower", ["email"]), "=", eb.fn<string>("lower", [eb.val(email)]))
}
