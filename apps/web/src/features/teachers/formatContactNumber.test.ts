import { describe, expect, it } from "vitest"
import { formatContactNumber } from "./formatContactNumber.ts"

describe("formatContactNumber", () => {
  it("groups eight digits as four and four", () => {
    expect(formatContactNumber("67363939")).toBe("6736 3939")
  })

  it.each(["6123456", "612345678", "abcdefgh", ""])("returns %j unchanged", (value) => {
    expect(formatContactNumber(value)).toBe(value)
  })
})
