import { SUBJECTS } from "@school-portal/contract"
import { fireEvent, screen, within } from "@testing-library/react"
import { userEvent, type UserEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../test/renderWithProviders.tsx"
import { TeacherForm, type TeacherFormProps } from "./TeacherForm.tsx"

const LEGACY_KEY_CODES = { ArrowDown: 40, Enter: 13 } as const

function pressKeyWithLegacyCode(element: Element, key: keyof typeof LEGACY_KEY_CODES) {
  const keyCode = LEGACY_KEY_CODES[key]
  fireEvent.keyDown(element, { key, code: key, keyCode, which: keyCode })
}

function renderForm(overrides: Partial<TeacherFormProps> = {}) {
  const props: TeacherFormProps = {
    onSubmit: vi.fn(),
    onBack: vi.fn(),
    isSubmitting: false,
    ...overrides,
  }
  renderWithProviders(<TeacherForm {...props} />)
  return props
}

async function chooseSubject(user: UserEvent, subject: string) {
  await user.click(screen.getByRole("combobox", { name: "Subject" }))
  await user.click(await screen.findByRole("option", { name: subject }))
}

async function fillValidTeacher(user: UserEvent, contactNumber = "6123 4567") {
  await user.type(screen.getByRole("textbox", { name: "Name" }), "Mary")
  await chooseSubject(user, "Mathematics")
  await user.type(screen.getByRole("textbox", { name: "Email Address" }), "teachermary@gmail.com")
  await user.type(screen.getByRole("textbox", { name: "Work Contact Number" }), contactNumber)
}

describe("TeacherForm", () => {
  it("shows the design labels and placeholders", () => {
    renderForm()

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("placeholder", "Name")
    expect(screen.getByRole("combobox", { name: "Subject" })).toBeInTheDocument()
    expect(screen.getByText("Select a subject")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Email Address" })).toHaveAttribute(
      "placeholder",
      "Email address",
    )
    expect(screen.getByRole("textbox", { name: "Work Contact Number" })).toHaveAttribute(
      "placeholder",
      "Work contact number",
    )
  })

  it("offers the nine subjects in documentation order", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("combobox", { name: "Subject" }))
    const listbox = await screen.findByRole("listbox")

    expect(
      within(listbox)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([...SUBJECTS])
  })

  it("selects a subject with ArrowDown and Enter", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    const subject = screen.getByRole("combobox", { name: "Subject" })
    subject.focus()
    pressKeyWithLegacyCode(subject, "ArrowDown")
    pressKeyWithLegacyCode(subject, "Enter")
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Mary")
    await user.type(screen.getByRole("textbox", { name: "Email Address" }), "mary@example.com")
    await user.type(screen.getByRole("textbox", { name: "Work Contact Number" }), "61234567")
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "English Language" }),
    )
  })

  it("flags every empty field and does not submit", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByText("This name is required.")).toBeInTheDocument()
    expect(screen.getByText("This subject is required.")).toBeInTheDocument()
    expect(screen.getByText("This email address is required.")).toBeInTheDocument()
    expect(screen.getByText("This work contact number is required.")).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it("shows the email and contact errors together, as in the design", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Gao Ah Xing")
    await chooseSubject(user, "English Language")
    await user.type(screen.getByRole("textbox", { name: "Email Address" }), "teacher@gov")
    await user.type(screen.getByRole("textbox", { name: "Work Contact Number" }), "9283 9999")
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(await screen.findByText("This email address is invalid.")).toBeInTheDocument()
    expect(screen.getByText("This work contact number is invalid.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAttribute(
      "aria-invalid",
      "true",
    )
    expect(screen.getByRole("combobox", { name: "Subject" })).not.toHaveAttribute(
      "aria-invalid",
      "true",
    )
  })

  it("wires errors for assistive technology, focuses the first one and clears it once fixed", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    const nameInput = screen.getByRole("textbox", { name: "Name" })
    await screen.findByText("This name is required.")
    expect(nameInput).toHaveAttribute("aria-invalid", "true")
    expect(nameInput).toHaveAccessibleDescription("This name is required.")
    expect(nameInput).toHaveFocus()

    await user.type(nameInput, "Mary")
    expect(screen.queryByText("This name is required.")).not.toBeInTheDocument()
  })

  it("submits the contact number as digits only", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await fillValidTeacher(user)
    await user.click(screen.getByRole("button", { name: "Add Teacher" }))

    expect(props.onSubmit).toHaveBeenCalledExactlyOnceWith({
      name: "Mary",
      subject: "Mathematics",
      email: "teachermary@gmail.com",
      contactNumber: "61234567",
    })
  })

  it("shows a server error under its field", () => {
    renderForm({
      serverError: { field: "email", message: "This email address is already registered." },
    })

    expect(screen.getByRole("textbox", { name: "Email Address" })).toHaveAccessibleDescription(
      "This email address is already registered.",
    )
  })

  it("disables the submit button while submitting", () => {
    renderForm({ isSubmitting: true })

    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled()
  })

  it("is a native form with browser validation turned off", () => {
    renderForm()

    expect(screen.getByRole("form", { name: "Add Teacher" })).toHaveAttribute("novalidate")
  })

  it("calls onBack from the Back button", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(props.onBack).toHaveBeenCalledOnce()
  })
})
