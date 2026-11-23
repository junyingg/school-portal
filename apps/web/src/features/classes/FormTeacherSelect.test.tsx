import { screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { describe, expect, it } from "vitest"
import { designTeachers } from "../../test/designFixtures.ts"
import {
  teachersEmpty,
  teachersFail,
  teachersPending,
  teachersWith,
} from "../../test/msw/handlers.ts"
import { server } from "../../test/msw/server.ts"
import { renderWithProviders } from "../../test/renderWithProviders.tsx"
import { FormTeacherSelect } from "./FormTeacherSelect.tsx"

function Harness() {
  const { control } = useForm<{ teacherEmail?: string }>()
  return (
    <form aria-label="Harness">
      <FormTeacherSelect control={control} name="teacherEmail" />
      <button type="button">After</button>
    </form>
  )
}

function formTeacherField(): HTMLElement {
  const combobox = screen.getByRole("combobox", { name: "Form Teacher" })
  const field = combobox.closest(".ant-form-item")
  if (!(field instanceof HTMLElement)) {
    throw new Error("Form Teacher field not found")
  }
  return field
}

async function openPopup(): Promise<HTMLElement> {
  await userEvent.setup().click(screen.getByRole("combobox", { name: "Form Teacher" }))
  const popup = document.querySelector(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
  if (!(popup instanceof HTMLElement)) {
    throw new Error("Form Teacher popup not open")
  }
  return popup
}

describe("FormTeacherSelect", () => {
  it("lists the teachers by name", async () => {
    renderWithProviders(<Harness />)
    await screen.findByRole("combobox", { name: "Form Teacher" })
    await within(formTeacherField()).findByText("Assign a form teacher")

    const popup = await openPopup()

    const options = await within(popup).findAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual(
      designTeachers.map((teacher) => teacher.name),
    )
  })

  it("appends the email to a name two teachers share", async () => {
    server.use(
      teachersWith([
        {
          name: "Gao Ah Xing",
          subject: "Art",
          email: "gao.one@example.com",
          contactNumber: "61111111",
        },
        {
          name: "Gao Ah Xing",
          subject: "Music",
          email: "gao.two@example.com",
          contactNumber: "63333333",
        },
      ]),
    )
    renderWithProviders(<Harness />)

    const popup = await openPopup()

    const labels = (await within(popup).findAllByRole("option")).map((option) => option.textContent)
    expect(labels).toEqual([
      "Gao Ah Xing (gao.one@example.com)",
      "Gao Ah Xing (gao.two@example.com)",
    ])
  })

  it("marks the select busy while teachers load", async () => {
    server.use(teachersPending())
    renderWithProviders(<Harness />)

    expect(await screen.findByRole("combobox", { name: "Form Teacher" })).toHaveAttribute(
      "aria-busy",
      "true",
    )
  })

  it("offers Retry when the teachers fail to load", async () => {
    server.use(teachersFail(500))
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const retry = await within(formTeacherField()).findByRole("button", { name: "Retry" })
    server.resetHandlers()
    await user.click(retry)
    const popup = await openPopup()

    expect(await within(popup).findAllByRole("option")).toHaveLength(6)
  })

  it("shows the no-teachers panel in the open popup and no note in the field", async () => {
    server.use(teachersEmpty())
    renderWithProviders(<Harness />)
    await within(formTeacherField()).findByText("No existing teachers.")

    const popup = await openPopup()

    expect(within(popup).getByText("No existing teachers.")).toBeInTheDocument()
    expect(within(popup).getByRole("link", { name: "Add a teacher" })).toHaveAttribute(
      "href",
      "/teachers/new",
    )
    expect(within(formTeacherField()).queryByText("No existing teachers.")).not.toBeInTheDocument()
  })

  it("shows the no-teachers note under the closed select, before and after opening", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const note = await within(formTeacherField()).findByText("No existing teachers.")
    expect(note).toBeInTheDocument()
    expect(within(formTeacherField()).getByRole("link", { name: "Add a teacher" })).toHaveAttribute(
      "href",
      "/teachers/new",
    )

    await openPopup()
    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: "After" }))

    expect(await within(formTeacherField()).findByText("No existing teachers.")).toBeInTheDocument()
    expect(
      document.querySelectorAll(".ant-select-dropdown:not(.ant-select-dropdown-hidden)"),
    ).toHaveLength(0)
  })

  it("lets the keyboard reach Add a teacher from the closed select", async () => {
    server.use(teachersEmpty())
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    await within(formTeacherField()).findByText("No existing teachers.")

    screen.getByRole("combobox", { name: "Form Teacher" }).focus()
    await user.tab()

    expect(within(formTeacherField()).getByRole("link", { name: "Add a teacher" })).toHaveFocus()
  })
})
