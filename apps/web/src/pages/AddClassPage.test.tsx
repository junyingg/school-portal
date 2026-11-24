import { FORM_TEACHER_TAKEN_MESSAGE, unknownTeacherEmailMessage } from "@school-portal/contract"
import { screen, within } from "@testing-library/react"
import { userEvent, type UserEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { readClassDraft } from "../features/classes/classDraft.ts"
import { AppRoutes } from "../routes.tsx"
import { designTeachers } from "../test/designFixtures.ts"
import {
  CLASSES_URL,
  createClassFails,
  createClassPending,
  networkError,
  teachersEmpty,
} from "../test/msw/handlers.ts"
import { requestLog, server } from "../test/msw/server.ts"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

const CHEN_EMAIL = designTeachers[5]?.email ?? ""
const GENERIC_MESSAGE = "Something went wrong. Please try again."

function formTeacherField(): HTMLElement {
  const field = screen.getByRole("combobox", { name: "Form Teacher" }).closest(".ant-form-item")
  if (!(field instanceof HTMLElement)) {
    throw new Error("Form Teacher field not found")
  }
  return field
}

function classLevelField(): HTMLElement {
  const field = screen.getByRole("combobox", { name: "Class Level" }).closest(".ant-form-item")
  if (!(field instanceof HTMLElement)) {
    throw new Error("Class Level field not found")
  }
  return field
}

function expectClass1BKept() {
  expect(screen.getByRole("textbox", { name: "Class Name" })).toHaveValue("Class 1B")
  expect(within(formTeacherField()).getByTitle("Chen Bing Bing")).toBeInTheDocument()
}

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

  it("preserves the class draft across the Add Teacher round trip", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderAddClassPage()
    await screen.findAllByText("No existing teachers.")

    await choose(user, "Class Level", "Primary 3")
    await user.type(screen.getByRole("textbox", { name: "Class Name" }), "Class 3C")
    await user.click(screen.getByRole("combobox", { name: "Form Teacher" }))
    const popup = document.querySelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
    if (!(popup instanceof HTMLElement)) {
      throw new Error("Form Teacher popup not open")
    }
    await user.click(within(popup).getByRole("link", { name: "Add a teacher" }))
    expect(
      await screen.findByRole("heading", { level: 1, name: "Add Teacher" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Add Class" })).toBeInTheDocument()
    expect(within(classLevelField()).getByTitle("Primary 3")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Class Name" })).toHaveValue("Class 3C")
  })

  it("returns to Add Class after saving a teacher from the no-teachers link", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderAddClassPage()
    await screen.findAllByText("No existing teachers.")

    await choose(user, "Class Level", "Primary 3")
    await user.type(screen.getByRole("textbox", { name: "Class Name" }), "Class 3C")
    await user.click(screen.getByRole("combobox", { name: "Form Teacher" }))
    const popup = document.querySelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
    if (!(popup instanceof HTMLElement)) {
      throw new Error("Form Teacher popup not open")
    }
    await user.click(within(popup).getByRole("link", { name: "Add a teacher" }))

    await screen.findByRole("heading", { level: 1, name: "Add Teacher" })
    await user.type(screen.getByRole("textbox", { name: "Name" }), "New Teacher")
    await choose(user, "Subject", "Mathematics")
    await user.type(screen.getByRole("textbox", { name: "Email Address" }), "new@example.com")
    await user.type(screen.getByRole("textbox", { name: "Work Contact Number" }), "61234567")
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Add Class" })).toBeInTheDocument()
    expect(within(classLevelField()).getByTitle("Primary 3")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Class Name" })).toHaveValue("Class 3C")
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
    expect(readClassDraft()).toBeUndefined()
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

  it("shows a taken form teacher under Form Teacher, focused, keeping the values", async () => {
    server.use(createClassFails(409, FORM_TEACHER_TAKEN_MESSAGE))
    const user = userEvent.setup()
    renderAddClassPage()

    await fillClass1B(user)
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    const formTeacher = screen.getByRole("combobox", { name: "Form Teacher" })
    expect(
      await screen.findByText("This teacher is already the form teacher of another class."),
    ).toBeInTheDocument()
    expect(formTeacher).toHaveAccessibleDescription(
      "This teacher is already the form teacher of another class.",
    )
    expect(formTeacher).toHaveFocus()
    expectClass1BKept()

    await user.type(screen.getByRole("textbox", { name: "Class Name" }), " Updated")
    expect(
      screen.getByText("This teacher is already the form teacher of another class."),
    ).toBeInTheDocument()

    await choose(user, "Form Teacher", "Hannah Low")
    expect(
      screen.queryByText("This teacher is already the form teacher of another class."),
    ).not.toBeInTheDocument()
    expect(formTeacher).not.toHaveAttribute("aria-invalid", "true")
  })

  it("shows an unknown form teacher under Form Teacher", async () => {
    server.use(createClassFails(400, unknownTeacherEmailMessage(CHEN_EMAIL)))
    const user = userEvent.setup()
    renderAddClassPage()

    await fillClass1B(user)
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByText("This form teacher could not be found.")).toBeInTheDocument()
    expectClass1BKept()
  })

  it.each([
    [400, "level is required"],
    [500, "Internal server error"],
  ])("shows a %i in the banner with the server's message", async (status, message) => {
    server.use(createClassFails(status, message))
    const user = userEvent.setup()
    renderAddClassPage()

    await fillClass1B(user)
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expectClass1BKept()
  })

  it("shows a network failure in the banner with the generic message", async () => {
    server.use(networkError("post", CLASSES_URL))
    const user = userEvent.setup()
    renderAddClassPage()

    await fillClass1B(user)
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(GENERIC_MESSAGE)
    expectClass1BKept()
  })
})
