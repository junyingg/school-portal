import { screen, within } from "@testing-library/react"
import { userEvent, type UserEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import { createTeacherPending, TEACHERS_URL } from "../test/msw/handlers.ts"
import { requestLog, server } from "../test/msw/server.ts"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

function renderAddTeacherPage() {
  renderWithProviders(<AppRoutes />, { route: "/teachers/new" })
}

function teacherPosts() {
  return requestLog.filter(
    (request) => request.method === "POST" && request.pathname === TEACHERS_URL,
  )
}

async function fillMary(user: UserEvent) {
  await user.type(screen.getByRole("textbox", { name: "Name" }), "Mary")
  await user.click(screen.getByRole("combobox", { name: "Subject" }))
  await user.click(await screen.findByRole("option", { name: "Mathematics" }))
  await user.type(screen.getByRole("textbox", { name: "Email Address" }), "teachermary@gmail.com")
  await user.type(screen.getByRole("textbox", { name: "Work Contact Number" }), "6123 4567")
}

describe("AddTeacherPage", () => {
  it("focuses the heading on arrival and keeps the Teachers tab current", () => {
    renderAddTeacherPage()

    expect(screen.getByRole("heading", { level: 1, name: "Add Teacher" })).toHaveFocus()
    expect(screen.getByRole("link", { name: "Teachers" })).toHaveAttribute("aria-current", "page")
  })

  it("shows the four required messages and sends nothing", async () => {
    const user = userEvent.setup()
    renderAddTeacherPage()

    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByText("This name is required.")).toBeInTheDocument()
    expect(screen.getByText("This work contact number is required.")).toBeInTheDocument()
    expect(teacherPosts()).toHaveLength(0)
  })

  it("disables the button while adding and sends one request on a double click", async () => {
    server.use(createTeacherPending())
    const user = userEvent.setup()
    renderAddTeacherPage()

    await fillMary(user)
    await user.dblClick(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByRole("button", { name: "Adding..." })).toBeDisabled()
    expect(teacherPosts()).toHaveLength(1)
  })

  it("returns to the list with the new teacher as row 7", async () => {
    const user = userEvent.setup()
    renderAddTeacherPage()

    await fillMary(user)
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    const table = await screen.findByRole("table", { name: "Teachers" })
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(8)
    expect(rows[7]).toHaveTextContent("7Mary")
    expect(rows[7]).toHaveTextContent("6123 4567")
  })

  it("goes back to the list without saving", async () => {
    const user = userEvent.setup()
    renderAddTeacherPage()

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Mary")
    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Teachers" })).toBeInTheDocument()
    expect(teacherPosts()).toHaveLength(0)
  })
})
