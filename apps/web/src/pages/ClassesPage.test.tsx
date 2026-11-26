import { noClassForTeacherMessage } from "@school-portal/contract"
import { screen, waitFor, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import {
  classesEmpty,
  classesFail,
  classesPending,
  deleteClassFails,
} from "../test/msw/handlers.ts"
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
    expect(screen.getByRole("button", { name: "Add Class" })).toBeInTheDocument()
  })

  it("shows the empty state with its only Add Class button inside the card", async () => {
    server.use(classesEmpty())
    const user = userEvent.setup()
    renderClassesPage()

    const card = await screen.findByRole("region", { name: "Classes" })
    expect(await within(card).findByText(EMPTY_MESSAGE)).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Add Class" })).toHaveLength(1)
    await user.click(within(card).getByRole("button", { name: "Add Class" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Add Class" })).toBeInTheDocument()
  })

  it("lists the five classes with the Add Class button in the header", async () => {
    renderClassesPage()

    const table = await screen.findByRole("table", { name: "Classes" })
    expect(within(table).getAllByRole("row")).toHaveLength(6)
    expect(screen.getAllByRole("button", { name: "Add Class" })).toHaveLength(1)
    expect(
      within(screen.getByRole("region", { name: "Classes" })).queryByRole("button", {
        name: "Add Class",
      }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument()
  })

  it("offers Retry after a load error", async () => {
    server.use(classesFail(500))
    const user = userEvent.setup()
    renderClassesPage()

    const retry = await screen.findByRole("button", { name: "Retry" })
    expect(screen.getByRole("button", { name: "Add Class" })).toBeInTheDocument()
    server.resetHandlers()
    await user.click(retry)

    expect(await screen.findByRole("table", { name: "Classes" })).toBeInTheDocument()
  })
})

describe("ClassesPage deleting a class", () => {
  it("deletes a class after confirming", async () => {
    const user = userEvent.setup()
    renderClassesPage()

    await user.click(await screen.findByRole("button", { name: "Delete Class 4D" }))
    const dialog = await screen.findByRole("dialog", { name: "Delete class?" })
    expect(dialog).toHaveTextContent("Delete Class 4D (Primary 4, form teacher Wong Sze Ting)?")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.queryByText("Class 4D")).not.toBeInTheDocument()
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(within(screen.getByRole("table", { name: "Classes" })).getAllByRole("row")).toHaveLength(
      5,
    )
  })

  it("says so when the class was already deleted", async () => {
    server.use(deleteClassFails(404, noClassForTeacherMessage("wong.szeting@example.com")))
    const user = userEvent.setup()
    renderClassesPage()

    await user.click(await screen.findByRole("button", { name: "Delete Class 4D" }))
    const dialog = await screen.findByRole("dialog", { name: "Delete class?" })
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    expect(
      await within(dialog).findByText("This class has already been deleted."),
    ).toBeInTheDocument()
  })
})
