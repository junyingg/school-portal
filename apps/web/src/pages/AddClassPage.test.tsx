import { screen, within } from "@testing-library/react"
import { userEvent, type UserEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import { CLASSES_URL, createClassPending, teachersEmpty } from "../test/msw/handlers.ts"
import { requestLog, server } from "../test/msw/server.ts"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

function renderAddClassPage() {
  renderWithProviders(<AppRoutes />, { route: "/classes/new" })
}

function classPosts() {
  return requestLog.filter(
    (request) => request.method === "POST" && request.pathname === CLASSES_URL,
  )
}

async function choose(user: UserEvent, fieldName: string, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: fieldName }))
  const listbox = await screen.findByRole("listbox")
  await user.click(await within(listbox).findByRole("option", { name: optionName }))
}

async function fillClass1B(user: UserEvent) {
  await choose(user, "Class Level", "Primary 1")
  await user.type(screen.getByRole("textbox", { name: "Class Name" }), "Class 1B")
  await choose(user, "Form Teacher", "Chen Bing Bing")
}

describe("AddClassPage", () => {
  it("focuses the heading on arrival and keeps the Classes tab current", () => {
    renderAddClassPage()

    expect(screen.getByRole("heading", { level: 1, name: "Add Class" })).toHaveFocus()
    expect(screen.getByRole("link", { name: "Classes" })).toHaveAttribute("aria-current", "page")
  })

  it("leads from the no-teachers panel to Add Teacher", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderAddClassPage()
    await screen.findAllByText("No existing teachers.")

    await user.click(screen.getByRole("combobox", { name: "Form Teacher" }))
    const popup = document.querySelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
    if (!(popup instanceof HTMLElement)) {
      throw new Error("Form Teacher popup not open")
    }
    await user.click(within(popup).getByRole("link", { name: "Add a teacher" }))

    expect(
      await screen.findByRole("heading", { level: 1, name: "Add Teacher" }),
    ).toBeInTheDocument()
  })

  it("shows the three required messages and sends nothing", async () => {
    const user = userEvent.setup()
    renderAddClassPage()

    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByText("This class level is required.")).toBeInTheDocument()
    expect(screen.getByText("This class name is required.")).toBeInTheDocument()
    expect(screen.getByText("This form teacher is required.")).toBeInTheDocument()
    expect(classPosts()).toHaveLength(0)
  })

  it("returns to the list with the new class as row 6", async () => {
    const user = userEvent.setup()
    renderAddClassPage()

    await fillClass1B(user)
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    const table = await screen.findByRole("table", { name: "Classes" })
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(7)
    expect(rows[6]).toHaveTextContent("6Primary 1Class 1BChen Bing Bing")
  })

  it("disables the button while adding and sends one request on a double click", async () => {
    server.use(createClassPending())
    const user = userEvent.setup()
    renderAddClassPage()

    await fillClass1B(user)
    await user.dblClick(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByRole("button", { name: "Adding..." })).toBeDisabled()
    expect(classPosts()).toHaveLength(1)
  })

  it("goes back to the list without saving", async () => {
    const user = userEvent.setup()
    renderAddClassPage()

    await user.type(screen.getByRole("textbox", { name: "Class Name" }), "Class 1B")
    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Classes" })).toBeInTheDocument()
    expect(classPosts()).toHaveLength(0)
  })
})
