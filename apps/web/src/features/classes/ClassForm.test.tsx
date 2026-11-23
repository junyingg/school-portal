import { CLASS_LEVELS } from "@school-portal/contract"
import { screen, within } from "@testing-library/react"
import { userEvent, type UserEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { designTeachers } from "../../test/designFixtures.ts"
import { renderWithProviders } from "../../test/renderWithProviders.tsx"
import { ClassForm, type ClassFormProps } from "./ClassForm.tsx"

const [HANNAH] = designTeachers

function renderForm(overrides: Partial<ClassFormProps> = {}) {
  const props: ClassFormProps = {
    onSubmit: vi.fn(),
    onBack: vi.fn(),
    isSubmitting: false,
    ...overrides,
  }
  renderWithProviders(<ClassForm {...props} />)
  return props
}

async function choose(user: UserEvent, fieldName: string, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: fieldName }))
  const listbox = await screen.findByRole("listbox")
  await user.click(within(listbox).getByRole("option", { name: optionName }))
}

describe("ClassForm", () => {
  it("shows the design labels, placeholders and buttons", async () => {
    renderForm()

    expect(screen.getByRole("combobox", { name: "Class Level" })).toHaveAttribute(
      "aria-required",
      "true",
    )
    expect(screen.getByText("Select a level")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Class Name" })).toHaveAttribute(
      "placeholder",
      "Class Name",
    )
    expect(screen.getByRole("textbox", { name: "Class Name" })).toHaveAttribute(
      "aria-required",
      "true",
    )
    expect(screen.getByRole("combobox", { name: "Form Teacher" })).toHaveAttribute(
      "aria-required",
      "true",
    )
    expect(await screen.findByText("Assign a form teacher")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add Class" })).toBeInTheDocument()
  })

  it("offers exactly Primary 1 to Primary 6 in order", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("combobox", { name: "Class Level" }))
    const listbox = await screen.findByRole("listbox")

    expect(
      within(listbox)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([...CLASS_LEVELS])
  })

  it("flags all three empty fields and focuses Class Level", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(await screen.findByText("This class level is required.")).toBeInTheDocument()
    expect(screen.getByText("This class name is required.")).toBeInTheDocument()
    expect(screen.getByText("This form teacher is required.")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Class Level" })).toHaveFocus()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it("submits the chosen teacher's email as teacherEmail", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await choose(user, "Class Level", "Primary 1")
    await user.type(screen.getByRole("textbox", { name: "Class Name" }), "Class 1A")
    await choose(user, "Form Teacher", "Hannah Low")
    await user.click(screen.getByRole("button", { name: "Add Class" }))

    expect(props.onSubmit).toHaveBeenCalledExactlyOnceWith({
      level: "Primary 1",
      name: "Class 1A",
      teacherEmail: HANNAH?.email,
    })
  })

  it("shows a server error under Form Teacher", async () => {
    renderForm({
      serverError: {
        field: "teacherEmail",
        message: "This teacher is already the form teacher of another class.",
      },
    })

    expect(
      await screen.findByText("This teacher is already the form teacher of another class."),
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Form Teacher" })).toHaveAccessibleDescription(
      "This teacher is already the form teacher of another class.",
    )
  })

  it("calls onBack from the Back button", async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(props.onBack).toHaveBeenCalledOnce()
  })
})
