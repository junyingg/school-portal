import { screen, waitFor, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import { teachersEmpty, teachersFail, teachersPending } from "../test/msw/handlers.ts"
import { requestLog, server } from "../test/msw/server.ts"
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
    expect(screen.getByRole("button", { name: "Add Teacher" })).toBeInTheDocument()
  })

  it("shows the empty state with its only Add Teacher button inside the card", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderTeachersPage()

    const card = await screen.findByRole("region", { name: "Teachers" })
    expect(await within(card).findByText(EMPTY_MESSAGE)).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Add Teacher" })).toHaveLength(1)
    await user.click(within(card).getByRole("button", { name: "Add Teacher" }))

    expect(
      await screen.findByRole("heading", { level: 1, name: "Add Teacher" }),
    ).toBeInTheDocument()
  })

  it("lists the six teachers with the Add Teacher button in the header", async () => {
    renderTeachersPage()

    const table = await screen.findByRole("table", { name: "Teachers" })
    expect(within(table).getAllByRole("row")).toHaveLength(7)
    expect(screen.getAllByRole("button", { name: "Add Teacher" })).toHaveLength(1)
    expect(
      within(screen.getByRole("region", { name: "Teachers" })).queryByRole("button", {
        name: "Add Teacher",
      }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument()
  })

  it("offers Retry after a load error", async () => {
    server.use(teachersFail(500))
    const user = userEvent.setup()
    renderTeachersPage()

    const retry = await screen.findByRole("button", { name: "Retry" })
    expect(screen.getByRole("button", { name: "Add Teacher" })).toBeInTheDocument()
    server.resetHandlers()
    await user.click(retry)

    expect(await screen.findByRole("table", { name: "Teachers" })).toBeInTheDocument()
  })
})

describe("TeachersPage deleting a teacher", () => {
  it("deletes a teacher with no class after confirming", async () => {
    const user = userEvent.setup()
    renderTeachersPage()

    await user.click(await screen.findByRole("button", { name: "Delete Chen Bing Bing" }))
    const dialog = await screen.findByRole("dialog", { name: "Delete teacher?" })
    expect(dialog).toHaveTextContent("Delete Chen Bing Bing (chen.bingbing@example.com)?")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.queryByText("Chen Bing Bing")).not.toBeInTheDocument()
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(
      within(screen.getByRole("table", { name: "Teachers" })).getAllByRole("row"),
    ).toHaveLength(6)
  })

  it("keeps the teacher and sends nothing when the deletion is cancelled", async () => {
    const user = userEvent.setup()
    renderTeachersPage()

    await user.click(await screen.findByRole("button", { name: "Delete Hannah Low" }))
    const dialog = await screen.findByRole("dialog", { name: "Delete teacher?" })
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Hannah Low")).toBeInTheDocument()
    expect(requestLog.filter((request) => request.method === "DELETE")).toEqual([])
  })

  it("explains that a form teacher's class must be deleted first", async () => {
    const user = userEvent.setup()
    renderTeachersPage()

    await user.click(await screen.findByRole("button", { name: "Delete Hannah Low" }))
    const dialog = await screen.findByRole("dialog", { name: "Delete teacher?" })
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    expect(
      await within(dialog).findByText(
        "This teacher is the form teacher of a class. Delete the class first.",
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole("table", { name: "Teachers" })).getByText("Hannah Low"),
    ).toBeInTheDocument()
  })
})
