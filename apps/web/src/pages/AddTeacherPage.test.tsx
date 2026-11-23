import { CONTACT_NUMBER_MESSAGE, TEACHER_EMAIL_TAKEN_MESSAGE } from "@school-portal/contract"
import { screen, within } from "@testing-library/react"
import { userEvent, type UserEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import {
  createTeacherFails,
  createTeacherPending,
  htmlBadGateway,
  networkError,
  TEACHERS_URL,
} from "../test/msw/handlers.ts"
import { requestLog, server } from "../test/msw/server.ts"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

const GENERIC_MESSAGE = "Something went wrong. Please try again."

function expectMaryKept() {
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Mary")
  expect(screen.getByRole("textbox", { name: "Email Address" })).toHaveValue(
    "teachermary@gmail.com",
  )
}

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

  it("shows a duplicate email under Email Address, focused, keeping the values", async () => {
    server.use(createTeacherFails(409, TEACHER_EMAIL_TAKEN_MESSAGE))
    const user = userEvent.setup()
    renderAddTeacherPage()

    await fillMary(user)
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    const email = screen.getByRole("textbox", { name: "Email Address" })
    expect(await screen.findByText("This email address is already registered.")).toBeInTheDocument()
    expect(email).toHaveAccessibleDescription("This email address is already registered.")
    expect(email).toHaveFocus()
    expectMaryKept()

    await user.type(screen.getByRole("textbox", { name: "Name" }), " Jr")
    expect(screen.getByText("This email address is already registered.")).toBeInTheDocument()

    await user.clear(email)
    await user.type(email, "teachermary2@gmail.com")
    expect(screen.queryByText("This email address is already registered.")).not.toBeInTheDocument()
    expect(email).not.toHaveAttribute("aria-invalid", "true")
  })

  it("keeps a banner error while the user edits", async () => {
    server.use(createTeacherFails(500, "Internal server error"))
    const user = userEvent.setup()
    renderAddTeacherPage()

    await fillMary(user)
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Internal server error")

    await user.type(screen.getByRole("textbox", { name: "Name" }), " Jr")

    expect(screen.getByRole("alert")).toHaveTextContent("Internal server error")
  })

  it.each([
    [400, CONTACT_NUMBER_MESSAGE],
    [500, "Internal server error"],
  ])("shows a %i in the banner with the server's message", async (status, message) => {
    server.use(createTeacherFails(status, message))
    const user = userEvent.setup()
    renderAddTeacherPage()

    await fillMary(user)
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expectMaryKept()
  })

  it.each([
    ["a network failure", networkError("post", TEACHERS_URL)],
    ["an HTML bad gateway", htmlBadGateway("post", TEACHERS_URL)],
  ])("shows %s in the banner with the generic message", async (_case, handler) => {
    server.use(handler)
    const user = userEvent.setup()
    renderAddTeacherPage()

    await fillMary(user)
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(GENERIC_MESSAGE)
    expectMaryKept()
  })
})
