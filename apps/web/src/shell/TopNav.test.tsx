import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderWithProviders } from "../test/renderWithProviders.tsx"
import { TopNav } from "./TopNav.tsx"

function tabLinks(): HTMLElement[] {
  return within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link")
}

describe("TopNav", () => {
  it("shows the brand, then the Classes and Teachers tabs in order", () => {
    renderWithProviders(<TopNav />, { route: "/classes" })

    expect(screen.getByText("School Portal")).toBeInTheDocument()
    expect(tabLinks().map((link) => link.textContent)).toEqual(["Classes", "Teachers"])
    expect(screen.queryByText("Manage Teachers")).not.toBeInTheDocument()
  })

  it.each([
    ["/teachers", "Teachers", "Classes"],
    ["/teachers/new", "Teachers", "Classes"],
    ["/classes", "Classes", "Teachers"],
    ["/classes/new", "Classes", "Teachers"],
  ])("on %s marks %s as the current tab", (route, currentTab, otherTab) => {
    renderWithProviders(<TopNav />, { route })

    expect(screen.getByRole("link", { name: currentTab })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: otherTab })).not.toHaveAttribute("aria-current")
  })
})
