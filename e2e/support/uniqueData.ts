import type { TestInfo } from "@playwright/test"

export interface TeacherData {
  readonly name: string
  readonly subject: string
  readonly email: string
  readonly contactNumber: string
}

const TEST_ID_LENGTH = 8

function uniqueSuffix(testInfo: TestInfo, label: string): string {
  return `${Date.now().toString(36)}${testInfo.testId.slice(0, TEST_ID_LENGTH)}${label}`
}

export function uniqueTeacher(testInfo: TestInfo, label = "t"): TeacherData {
  const suffix = uniqueSuffix(testInfo, label)
  return {
    name: `E2E Teacher ${suffix}`,
    subject: "Mathematics",
    email: `mary+${suffix}@example.com`,
    contactNumber: "61234567",
  }
}

export function uniqueClassName(testInfo: TestInfo, label = "c"): string {
  return `E2E ${uniqueSuffix(testInfo, label)}`
}
