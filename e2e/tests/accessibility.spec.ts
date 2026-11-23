import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const TEACHERS = {
  data: [
    {
      name: "Hannah Low",
      subject: "English Language",
      email: "hannah.low@example.com",
      contactNumber: "67363939",
    },
    {
      name: "Wong Sze Ting",
      subject: "Mathematics",
      email: "wong.szeting@example.com",
      contactNumber: "62810482",
    },
  ],
}

const CLASSES = {
  data: [{ level: "Primary 1", name: "Class 1A", formTeacher: { name: "Hannah Low" } }],
}

const PAGES = ["/teachers", "/classes", "/teachers/new", "/classes/new"] as const

test.beforeEach(async ({ page }) => {
  await page.route("**/api/teachers", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TEACHERS) }),
  )
  await page.route("**/api/classes", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CLASSES) }),
  )
})

test("has no automatically detectable WCAG A/AA violations", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path)
    await page.waitForLoadState("networkidle")

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()

    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([])
  }
})
