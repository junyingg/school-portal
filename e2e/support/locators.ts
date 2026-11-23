import type { Locator, Page } from "@playwright/test"

export function fieldNamed(page: Page, label: string): Locator {
  return page.locator(".ant-form-item").filter({ has: page.getByLabel(label, { exact: true }) })
}

export function openPopup(page: Page): Locator {
  return page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
}

export async function choose(page: Page, label: string, option: string): Promise<void> {
  await page.getByRole("combobox", { name: label }).click()
  await openPopup(page).getByRole("option", { name: option, exact: true }).click()
}
