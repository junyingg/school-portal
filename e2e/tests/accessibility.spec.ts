import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { openPopup } from "../support/locators.ts"

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
  data: [
    {
      level: "Primary 1",
      name: "Class 1A",
      formTeacher: { name: "Hannah Low", email: "hannah.low@example.com" },
    },
  ],
}

const PAGES = ["/teachers", "/classes", "/teachers/new", "/classes/new"] as const
const WCAG_A_AND_AA = ["wcag2a", "wcag2aa"]
const NO_TEACHERS_PROMPT_RULES = ["color-contrast", "aria-required-children"]

interface ViolationSummary {
  readonly id: string
  readonly impact: string | null | undefined
  readonly nodes: readonly unknown[]
}

async function violationsFrom(builder: AxeBuilder): Promise<ViolationSummary[]> {
  const results = await builder.analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target),
  }))
}

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

    expect(await violationsFrom(new AxeBuilder({ page }).withTags(WCAG_A_AND_AA))).toEqual([])
  }
})

test("shows the no-teachers prompts with readable text and a valid option list", async ({
  page,
}) => {
  await page.route("**/api/teachers", (route) => route.fulfill({ json: { data: [] } }))
  await page.goto("/classes/new")
  await expect(page.getByText("No existing teachers.")).toBeVisible()
  const closedViolations = await violationsFrom(
    new AxeBuilder({ page }).withRules(NO_TEACHERS_PROMPT_RULES),
  )

  await page.getByRole("combobox", { name: "Form Teacher" }).click()
  await expect(openPopup(page).getByText("No existing teachers.")).toBeVisible()
  const openViolations = await violationsFrom(
    new AxeBuilder({ page }).withRules(NO_TEACHERS_PROMPT_RULES),
  )

  expect(closedViolations).toEqual([])
  expect(openViolations).toEqual([])
})

test("has no automatically detectable WCAG A/AA violations in the delete dialogs", async ({
  page,
}) => {
  for (const [path, buttonName] of [
    ["/teachers", "Delete Hannah Low"],
    ["/classes", "Delete Class 1A"],
  ] as const) {
    await page.goto(path)
    await page.getByRole("button", { name: buttonName }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    expect(await violationsFrom(new AxeBuilder({ page }).withTags(WCAG_A_AND_AA))).toEqual([])
  }
})
