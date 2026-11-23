import { screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import { classesEmpty, classesFail, classesPending } from "../test/msw/handlers.ts"
import { server } from "../test/msw/server.ts"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

const EMPTY_MESSAGE = "There are no existing classes yet."

function renderClassesPage() {
  renderWithProviders(<AppRoutes />, { route: "/classes" })
}

describe("ClassesPage", () => {
  it("shows a busy card while the classes load", async () => {
    server.use(classesPending())
    renderClassesPage()

    expect(await screen.findByRole("region", { name: "Classes" })).toHaveAttribute(
      "aria-busy",
      "true",
    )
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument()
  })

  it("shows the empty state with one Add Class button that opens the form", async () => {
    server.use(classesEmpty())
    const user = userEvent.setup()
    renderClassesPage()

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Add Class" })).toBeInTheDocument()
  })

  it("lists the five classes with the Add Class button in the header", async () => {
    renderClassesPage()

    const table = await screen.findByRole("table", { name: "Classes" })
    expect(within(table).getAllByRole("row")).toHaveLength(6)
    expect(screen.getByRole("button", { name: "Add Class" })).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument()
  })

  it("offers Retry after a load error", async () => {
    server.use(classesFail(500))
    const user = userEvent.setup()
    renderClassesPage()

    const retry = await screen.findByRole("button", { name: "Retry" })
    server.resetHandlers()
    await user.click(retry)

    expect(await screen.findByRole("table", { name: "Classes" })).toBeInTheDocument()
  })
})
