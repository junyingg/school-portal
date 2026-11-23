import type { Migration } from "kysely/migration"
import * as createTeachersAndClasses from "./0001_create_teachers_and_classes.ts"

export const migrations: Readonly<Record<string, Migration>> = {
  "0001_create_teachers_and_classes": createTeachersAndClasses,
}
