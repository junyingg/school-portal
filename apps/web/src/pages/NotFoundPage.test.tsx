import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AppRoutes } from "../routes.tsx"
import { renderWithProviders } from "../test/renderWithProviders.tsx"

describe("unknown route", () => {
  it("shows a not-found page linking to Classes with no current tab", () => {
    renderWithProviders(<AppRoutes />, { route: "/nope" })

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Go to Classes" })).toHaveAttribute("href", "/classes")
    expect(screen.getByRole("link", { name: "Classes" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("link", { name: "Teachers" })).not.toHaveAttribute("aria-current")
  })
})

describe("root route", () => {
  it("redirects to Classes", () => {
    renderWithProviders(<AppRoutes />, { route: "/" })

    expect(screen.getByRole("link", { name: "Classes" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("heading", { level: 1, name: "Classes" })).toBeInTheDocument()
  })
})
