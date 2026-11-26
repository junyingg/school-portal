import { screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { designTeachers } from "../../test/designFixtures.ts"
import { renderWithProviders } from "../../test/renderWithProviders.tsx"
import { TeacherTable } from "./TeacherTable.tsx"

function cellTexts(row: HTMLElement): (string | null)[] {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent)
}

describe("TeacherTable", () => {
  it("shows the design headers, then an actions column named only for screen readers", () => {
    renderWithProviders(<TeacherTable teachers={designTeachers} onDelete={vi.fn()} />)

    const table = screen.getByRole("table", { name: "Teachers" })
    const headers = within(table).getAllByRole("columnheader")
    expect(headers.map((header) => header.textContent)).toEqual([
      "#",
      "Name",
      "Subject",
      "Email",
      "Work Contact",
      "",
    ])
    expect(headers.flatMap((header) => within(header).queryAllByRole("button"))).toEqual([])
    expect(
      within(screen.getByRole("table")).getByRole("columnheader", { name: "Actions" }),
    ).toHaveTextContent("")
  })

  it("numbers rows from 1 in insertion order and formats the contact number", () => {
    renderWithProviders(<TeacherTable teachers={designTeachers} onDelete={vi.fn()} />)

    const [, ...rows] = within(screen.getByRole("table", { name: "Teachers" })).getAllByRole("row")
    expect(rows).toHaveLength(6)
    expect(cellTexts(rows[0] as HTMLElement)).toEqual([
      "1",
      "Hannah Low",
      "English Language",
      "hannah.low@example.com",
      "6736 3939",
      "",
    ])
    expect(cellTexts(rows[5] as HTMLElement).slice(0, 2)).toEqual(["6", "Chen Bing Bing"])
  })
})

describe("TeacherTable delete buttons", () => {
  it("names each Delete button after its teacher and reports that teacher", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(<TeacherTable teachers={designTeachers} onDelete={onDelete} />)

    await user.click(screen.getByRole("button", { name: "Delete Chen Bing Bing" }))

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(designTeachers[5])
  })

  it("shows each Delete button as an icon with a Delete tooltip", async () => {
    const user = userEvent.setup()
    renderWithProviders(<TeacherTable teachers={designTeachers} onDelete={vi.fn()} />)
    const button = screen.getByRole("button", { name: "Delete Hannah Low" })

    expect(button).toHaveTextContent("")
    expect(button.querySelector(".anticon-delete")).not.toBeNull()
    await user.hover(button)
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Delete")
  })
})
