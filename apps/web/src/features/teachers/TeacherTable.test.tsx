import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { designTeachers } from "../../test/designFixtures.ts"
import { renderWithProviders } from "../../test/renderWithProviders.tsx"
import { TeacherTable } from "./TeacherTable.tsx"

function cellTexts(row: HTMLElement): (string | null)[] {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent)
}

describe("TeacherTable", () => {
  it("shows the design headers without sort controls", () => {
    renderWithProviders(<TeacherTable teachers={designTeachers} />)

    const table = screen.getByRole("table", { name: "Teachers" })
    const headers = within(table).getAllByRole("columnheader")
    expect(headers.map((header) => header.textContent)).toEqual([
      "#",
      "Name",
      "Subject",
      "Email",
      "Work Contact",
    ])
    expect(headers.flatMap((header) => within(header).queryAllByRole("button"))).toEqual([])
  })

  it("numbers rows from 1 in insertion order and formats the contact number", () => {
    renderWithProviders(<TeacherTable teachers={designTeachers} />)

    const [, ...rows] = within(screen.getByRole("table", { name: "Teachers" })).getAllByRole("row")
    expect(rows).toHaveLength(6)
    expect(cellTexts(rows[0] as HTMLElement)).toEqual([
      "1",
      "Hannah Low",
      "English Language",
      "hannah.low@example.com",
      "6736 3939",
    ])
    expect(cellTexts(rows[5] as HTMLElement).slice(0, 2)).toEqual(["6", "Chen Bing Bing"])
  })
})
