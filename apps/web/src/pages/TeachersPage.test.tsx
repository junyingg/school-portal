import { screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import { teachersEmpty, teachersFail, teachersPending } from "../test/msw/handlers.ts"
import { server } from "../test/msw/server.ts"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

const EMPTY_MESSAGE = "There are no existing teachers yet."

function renderTeachersPage() {
  renderWithProviders(<AppRoutes />, { route: "/teachers" })
}

describe("TeachersPage", () => {
  it("shows a busy card while the teachers load", async () => {
    server.use(teachersPending())
    renderTeachersPage()

    expect(await screen.findByRole("region", { name: "Teachers" })).toHaveAttribute(
      "aria-busy",
      "true",
    )
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument()
  })

  it("shows the empty state with one Add Teacher button that opens the form", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderTeachersPage()

    expect(await screen.findByText(EMPTY_MESSAGE)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(
      await screen.findByRole("heading", { level: 1, name: "Add Teacher" }),
    ).toBeInTheDocument()
  })

  it("lists the six teachers with the Add Teacher button in the header", async () => {
    renderTeachersPage()

    const table = await screen.findByRole("table", { name: "Teachers" })
    expect(within(table).getAllByRole("row")).toHaveLength(7)
    expect(screen.getByRole("button", { name: "Add Teacher" })).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument()
  })

  it("offers Retry after a load error", async () => {
    server.use(teachersFail(500))
    const user = userEvent.setup()
    renderTeachersPage()

    const retry = await screen.findByRole("button", { name: "Retry" })
    server.resetHandlers()
    await user.click(retry)

    expect(await screen.findByRole("table", { name: "Teachers" })).toBeInTheDocument()
  })
})
