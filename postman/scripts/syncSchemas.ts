import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
  BODY_TOO_LARGE_MESSAGE,
  FORM_TEACHER_TAKEN_MESSAGE,
  INVALID_JSON_MESSAGE,
  NOT_AN_OBJECT_MESSAGE,
  TEACHER_EMAIL_TAKEN_MESSAGE,
  UNSUPPORTED_MEDIA_TYPE_MESSAGE,
  classListResponseSchema,
  errorResponseSchema,
  schoolClassSchema,
  teacherListResponseSchema,
  teacherSchema,
} from "@school-portal/contract"
import { z } from "zod"

const COLLECTION_PATH = fileURLToPath(
  new URL("../school-portal.postman_collection.json", import.meta.url),
)
const JSON_INDENT = 2

interface CollectionVariable {
  readonly key: string
  readonly value: string
}

interface Collection {
  readonly variable: readonly CollectionVariable[]
}

function draft07JsonSchema(schema: z.ZodType): string {
  return JSON.stringify(z.toJSONSchema(schema, { target: "draft-07" }))
}

const SYNCED_VALUES = new Map<string, string>([
  ["teacherSchema", draft07JsonSchema(teacherSchema)],
  ["teacherListSchema", draft07JsonSchema(teacherListResponseSchema)],
  ["classSchema", draft07JsonSchema(schoolClassSchema)],
  ["classListSchema", draft07JsonSchema(classListResponseSchema)],
  ["errorSchema", draft07JsonSchema(errorResponseSchema)],
  ["teacherEmailTakenMessage", TEACHER_EMAIL_TAKEN_MESSAGE],
  ["formTeacherTakenMessage", FORM_TEACHER_TAKEN_MESSAGE],
  ["invalidJsonMessage", INVALID_JSON_MESSAGE],
  ["notAnObjectMessage", NOT_AN_OBJECT_MESSAGE],
  ["unsupportedMediaTypeMessage", UNSUPPORTED_MEDIA_TYPE_MESSAGE],
  ["bodyTooLargeMessage", BODY_TOO_LARGE_MESSAGE],
])

function syncedVariable(variable: CollectionVariable): CollectionVariable {
  const value = SYNCED_VALUES.get(variable.key)
  return value === undefined ? variable : { ...variable, value }
}

function withSyncedVariables(collection: Collection): Collection {
  return { ...collection, variable: collection.variable.map(syncedVariable) }
}

const isCheckMode = process.argv.includes("--check")
const currentText = await readFile(COLLECTION_PATH, "utf8")
const syncedText = `${JSON.stringify(withSyncedVariables(JSON.parse(currentText) as Collection), null, JSON_INDENT)}\n`

if (isCheckMode) {
  if (syncedText !== currentText) {
    console.error("The Postman collection is out of date with the contract. Run: pnpm postman:sync")
    process.exitCode = 1
  }
} else {
  await writeFile(COLLECTION_PATH, syncedText)
  console.log("Synced JSON schemas and messages into the Postman collection.")
}
