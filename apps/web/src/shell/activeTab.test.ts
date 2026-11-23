import { describe, expect, it } from "vitest"
import { activeTabFor } from "./activeTab.ts"

describe("activeTabFor", () => {
  it.each(["/teachers", "/teachers/new"])("returns the Teachers tab for %s", (pathname) => {
    expect(activeTabFor(pathname)).toBe("teachers")
  })

  it.each(["/classes", "/classes/new"])("returns the Classes tab for %s", (pathname) => {
    expect(activeTabFor(pathname)).toBe("classes")
  })

  it.each(["/teachersx", "/nope", "/"])("returns no tab for %s", (pathname) => {
    expect(activeTabFor(pathname)).toBeUndefined()
  })
})
