import { expect, test, type APIRequestContext } from "@playwright/test"
import { choose, fieldNamed, openPopup } from "../support/locators.ts"
import { uniqueClassName, uniqueTeacher, type TeacherData } from "../support/uniqueData.ts"

async function seedTeacher(request: APIRequestContext, teacher: TeacherData): Promise<void> {
  const response = await request.post("/api/teachers", { data: teacher })
  expect(response.status()).toBe(201)
}

test("adds a class with a form teacher", async ({ page, request }, testInfo) => {
  const teacher = uniqueTeacher(testInfo)
  const className = uniqueClassName(testInfo)
  await seedTeacher(request, teacher)

  await page.goto("/classes")
  await page.getByRole("button", { name: "Add Class" }).first().click()
  await choose(page, "Class Level", "Primary 1")
  await page.getByRole("textbox", { name: "Class Name" }).fill(className)
  await choose(page, "Form Teacher", teacher.name)
  await page.getByRole("button", { name: "Add Class" }).click()

  await expect(page).toHaveURL(/\/classes$/)
  const row = page.getByRole("row").filter({ hasText: className })
  await expect(row).toContainText("Primary 1")
  await expect(row).toContainText(teacher.name)
})

test("shows a form-teacher conflict under Form Teacher and keeps the values", async ({
  page,
  request,
}, testInfo) => {
  const teacher = uniqueTeacher(testInfo)
  const firstClass = uniqueClassName(testInfo, "a")
  const secondClass = uniqueClassName(testInfo, "b")
  await seedTeacher(request, teacher)
  const seededClass = await request.post("/api/classes", {
    data: { level: "Primary 1", name: firstClass, teacherEmail: teacher.email },
  })
  expect(seededClass.status()).toBe(201)

  await page.goto("/classes/new")
  await choose(page, "Class Level", "Primary 2")
  await page.getByRole("textbox", { name: "Class Name" }).fill(secondClass)
  await choose(page, "Form Teacher", teacher.name)
  await page.getByRole("button", { name: "Add Class" }).click()

  await expect(fieldNamed(page, "Form Teacher")).toContainText(
    "This teacher is already the form teacher of another class.",
  )
  await expect(page.getByRole("textbox", { name: "Class Name" })).toHaveValue(secondClass)
})

test("shows the empty state (stubbed API)", async ({ page }) => {
  await page.route("**/api/classes", (route) => route.fulfill({ json: { data: [] } }))

  await page.goto("/classes")

  await expect(page.getByText("There are no existing classes yet.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Add Class" })).toHaveCount(1)
})

test("leads from the no-teachers panel to Add Teacher (stubbed API)", async ({ page }) => {
  await page.route("**/api/teachers", (route) => route.fulfill({ json: { data: [] } }))

  await page.goto("/classes/new")
  const field = fieldNamed(page, "Form Teacher")
  await expect(field.getByText("No existing teachers.")).toBeVisible()

  await page.getByRole("combobox", { name: "Form Teacher" }).click()
  const popup = openPopup(page)
  await expect(popup.getByText("No existing teachers.")).toBeVisible()
  await expect(field.getByText("No existing teachers.")).toHaveCount(0)
  await popup.getByRole("link", { name: "Add a teacher" }).click()

  await expect(page).toHaveURL(/\/teachers\/new$/)
  await expect(page.getByRole("heading", { level: 1, name: "Add Teacher" })).toBeVisible()
})
