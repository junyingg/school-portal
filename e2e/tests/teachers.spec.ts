import { expect, test } from "@playwright/test"
import { choose, fieldNamed } from "../support/locators.ts"
import { uniqueTeacher } from "../support/uniqueData.ts"

test("registers a teacher and lists the formatted contact number", async ({ page }, testInfo) => {
  const teacher = uniqueTeacher(testInfo)

  await page.goto("/teachers")
  await page.getByRole("button", { name: "Add Teacher" }).first().click()
  await page.getByRole("textbox", { name: "Name" }).fill(teacher.name)
  await choose(page, "Subject", teacher.subject)
  await page.getByRole("textbox", { name: "Email Address" }).fill(teacher.email)
  await page.getByRole("textbox", { name: "Work Contact Number" }).fill("6123 4567")
  await page.getByRole("button", { name: "Add Teacher" }).click()

  await expect(page).toHaveURL(/\/teachers$/)
  const row = page.getByRole("row").filter({ hasText: teacher.email })
  await expect(row).toContainText(teacher.name)
  await expect(row).toContainText("6123 4567")
})

test("shows the email and contact errors together and sends nothing", async ({
  page,
}, testInfo) => {
  const teacher = uniqueTeacher(testInfo)
  const teacherPosts: string[] = []
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/teachers")) {
      teacherPosts.push(request.url())
    }
  })

  await page.goto("/teachers/new")
  await page.getByRole("textbox", { name: "Name" }).fill(teacher.name)
  await choose(page, "Subject", "English Language")
  await page.getByRole("textbox", { name: "Email Address" }).fill("teacher@gov")
  await page.getByRole("textbox", { name: "Work Contact Number" }).fill("9283 9999")
  await page.getByRole("button", { name: "Add Teacher" }).click()

  await expect(fieldNamed(page, "Email Address")).toContainText("This email address is invalid.")
  await expect(fieldNamed(page, "Work Contact Number")).toContainText(
    "This work contact number is invalid.",
  )
  expect(teacherPosts).toEqual([])
})

test("shows a duplicate email under Email Address", async ({ page, request }, testInfo) => {
  const teacher = uniqueTeacher(testInfo)
  const seeded = await request.post("/api/teachers", { data: teacher })
  expect(seeded.status()).toBe(201)

  await page.goto("/teachers/new")
  await page.getByRole("textbox", { name: "Name" }).fill(`${teacher.name} again`)
  await choose(page, "Subject", teacher.subject)
  await page.getByRole("textbox", { name: "Email Address" }).fill(teacher.email)
  await page.getByRole("textbox", { name: "Work Contact Number" }).fill(teacher.contactNumber)
  await page.getByRole("button", { name: "Add Teacher" }).click()

  await expect(fieldNamed(page, "Email Address")).toContainText(
    "This email address is already registered.",
  )
})

test("shows the empty state (stubbed API)", async ({ page }) => {
  await page.route("**/api/teachers", (route) => route.fulfill({ json: { data: [] } }))

  await page.goto("/teachers")

  const card = page.getByRole("region", { name: "Teachers", exact: true })
  await expect(card.getByText("There are no existing teachers yet.")).toBeVisible()
  await expect(card.getByRole("button", { name: "Add Teacher" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Add Teacher" })).toHaveCount(1)
})
