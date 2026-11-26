import { describe, expect, it } from "vitest"
import { CLASSES_FORM_TEACHER_ID_FKEY } from "../db/constraintNames.ts"
import { isRestrictViolationOn } from "./postgresErrors.ts"

describe("isRestrictViolationOn", () => {
  it("recognises a restrict violation on the named constraint", () => {
    const error = { code: "23001", constraint: CLASSES_FORM_TEACHER_ID_FKEY }

    expect(isRestrictViolationOn(error, CLASSES_FORM_TEACHER_ID_FKEY)).toBe(true)
  })

  it.each([
    ["a restrict violation on another constraint", { code: "23001", constraint: "other_fkey" }],
    [
      "a foreign key violation from an insert",
      { code: "23503", constraint: CLASSES_FORM_TEACHER_ID_FKEY },
    ],
    ["an error without a code", new Error("boom")],
    ["a thrown string", "boom"],
    ["null", null],
  ])("ignores %s", (_case, error) => {
    expect(isRestrictViolationOn(error, CLASSES_FORM_TEACHER_ID_FKEY)).toBe(false)
  })
})
