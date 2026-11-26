import type { Migration } from "kysely/migration"
import * as createTeachersAndClasses from "./0001_create_teachers_and_classes.ts"
import * as grantAppDelete from "./0002_grant_app_delete.ts"

export const migrations: Readonly<Record<string, Migration>> = {
  "0001_create_teachers_and_classes": createTeachersAndClasses,
  "0002_grant_app_delete": grantAppDelete,
}
