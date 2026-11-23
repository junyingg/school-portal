import { expect, test } from "@playwright/test"

const TEACHERS = [
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
]

test("serves a JSON 404 at the bare /api path", async ({ request }) => {
  const response = await request.get("/api")

  expect(response.status()).toBe(404)
  expect(response.headers()["content-type"]).toContain("application/json")
  expect(await response.json()).toEqual({ error: "Not found" })
})

test("keeps the teachers table inside a narrow viewport", async ({ page }) => {
  await page.route("**/api/teachers", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: TEACHERS }),
    }),
  )

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto("/teachers")

    const table = page.getByRole("table", { name: "Teachers" })
    await expect(table).toBeVisible()

    const region = page.getByRole("region", { name: "Teachers table" })
    await region.focus()
    await expect(region).toBeFocused()

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
})
