import { describe, expect, it } from "vitest"
import { toTeacher } from "./teacherMapper.ts"

describe("toTeacher", () => {
  it("drops the id and keeps the spec key order", () => {
    const record = {
      contactNumber: "68129414",
      id: 7,
      email: "teachermary@gmail.com",
      subject: "Mathematics",
      name: "Mary",
    }

    expect(JSON.stringify(toTeacher(record))).toBe(
      '{"name":"Mary","subject":"Mathematics","email":"teachermary@gmail.com","contactNumber":"68129414"}',
    )
  })
})
