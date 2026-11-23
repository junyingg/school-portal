import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { designClasses } from "../../test/designFixtures.ts"
import { renderWithProviders } from "../../test/renderWithProviders.tsx"
import { ClassTable } from "./ClassTable.tsx"

function dataRows(): HTMLElement[] {
  const [, ...rows] = within(screen.getByRole("table", { name: "Classes" })).getAllByRole("row")
  return rows
}

function cellTexts(row: HTMLElement): (string | null)[] {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent)
}

describe("ClassTable", () => {
  it("shows the design headers without sort controls", () => {
    renderWithProviders(<ClassTable classes={designClasses} />)

    const headers = within(screen.getByRole("table", { name: "Classes" })).getAllByRole(
      "columnheader",
    )
    expect(headers.map((header) => header.textContent)).toEqual([
      "#",
      "Class Level",
      "Class Name",
      "Form Teacher",
    ])
    expect(headers.flatMap((header) => within(header).queryAllByRole("button"))).toEqual([])
  })

  it("shows the five design rows numbered from 1", () => {
    renderWithProviders(<ClassTable classes={designClasses} />)

    const rows = dataRows()
    expect(rows).toHaveLength(5)
    expect(cellTexts(rows[0] as HTMLElement)).toEqual(["1", "Primary 1", "Class 1A", "Hannah Low"])
    expect(cellTexts(rows[4] as HTMLElement)).toEqual(["5", "Primary 2", "Class 2B", "Gao Ah Xing"])
  })

  it("keeps insertion order rather than sorting by level", () => {
    renderWithProviders(<ClassTable classes={designClasses} />)

    expect(dataRows().map((row) => cellTexts(row)[1])).toEqual([
      "Primary 1",
      "Primary 4",
      "Primary 5",
      "Primary 3",
      "Primary 2",
    ])
  })
})
