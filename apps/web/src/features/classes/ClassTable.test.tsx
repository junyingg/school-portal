import { screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
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
  it("shows the design headers, then an actions column named only for screen readers", () => {
    renderWithProviders(<ClassTable classes={designClasses} onDelete={vi.fn()} />)

    const headers = within(screen.getByRole("table", { name: "Classes" })).getAllByRole(
      "columnheader",
    )
    expect(headers.map((header) => header.textContent)).toEqual([
      "#",
      "Class Level",
      "Class Name",
      "Form Teacher",
      "",
    ])
    expect(headers.flatMap((header) => within(header).queryAllByRole("button"))).toEqual([])
    expect(
      within(screen.getByRole("table")).getByRole("columnheader", { name: "Actions" }),
    ).toHaveTextContent("")
  })

  it("shows the five design rows numbered from 1", () => {
    renderWithProviders(<ClassTable classes={designClasses} onDelete={vi.fn()} />)

    const rows = dataRows()
    expect(rows).toHaveLength(5)
    expect(cellTexts(rows[0] as HTMLElement)).toEqual([
      "1",
      "Primary 1",
      "Class 1A",
      "Hannah Low",
      "",
    ])
    expect(cellTexts(rows[4] as HTMLElement).slice(0, 4)).toEqual([
      "5",
      "Primary 2",
      "Class 2B",
      "Gao Ah Xing",
    ])
  })

  it("keeps insertion order rather than sorting by level", () => {
    renderWithProviders(<ClassTable classes={designClasses} onDelete={vi.fn()} />)

    expect(dataRows().map((row) => cellTexts(row)[1])).toEqual([
      "Primary 1",
      "Primary 4",
      "Primary 5",
      "Primary 3",
      "Primary 2",
    ])
  })
})

describe("ClassTable delete buttons", () => {
  it("names each Delete button after its class and reports that class", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(<ClassTable classes={designClasses} onDelete={onDelete} />)

    await user.click(screen.getByRole("button", { name: "Delete Class 4D" }))

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(designClasses[1])
  })

  it("shows each Delete button as an icon with a Delete tooltip", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClassTable classes={designClasses} onDelete={vi.fn()} />)
    const button = screen.getByRole("button", { name: "Delete Class 1A" })

    expect(button).toHaveTextContent("")
    expect(button.querySelector(".anticon-delete")).not.toBeNull()
    await user.hover(button)
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Delete")
  })
})
