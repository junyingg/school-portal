import { beforeEach, describe, expect, it } from "vitest"
import {
  CLASS_DRAFT_MAX_AGE_MS,
  clearClassDraft,
  readClassDraft,
  writeClassDraft,
} from "./classDraft.ts"

const NOW = 1_700_000_000_000

beforeEach(() => {
  clearClassDraft()
})

describe("class draft", () => {
  it("round-trips the level, name and teacher email", () => {
    writeClassDraft(
      { level: "Primary 2", name: "Class 2B", teacherEmail: "teacher@example.com" },
      NOW,
    )

    expect(readClassDraft(NOW)).toEqual({
      level: "Primary 2",
      name: "Class 2B",
      teacherEmail: "teacher@example.com",
    })
  })

  it("drops values that are not usable", () => {
    writeClassDraft({ level: "Primary 9", name: 42, teacherEmail: "" }, NOW)

    expect(readClassDraft(NOW)).toBeUndefined()
  })

  it("expires an old draft", () => {
    writeClassDraft({ name: "Class 1A" }, NOW)

    expect(readClassDraft(NOW + CLASS_DRAFT_MAX_AGE_MS + 1)).toBeUndefined()
  })

  it("ignores a corrupt draft", () => {
    sessionStorage.setItem("school-portal:class-draft", "{not-json")

    expect(readClassDraft(NOW)).toBeUndefined()
  })
})
