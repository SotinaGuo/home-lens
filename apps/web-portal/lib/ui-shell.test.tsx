import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { AppShell } from "@/components/app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/"
}));

describe("HomeLens product shell", () => {
  it("presents the app as a focused analytics workspace with primary navigation", () => {
    render(
      <AppShell>
        <HomePage />
      </AppShell>
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeTruthy();
    expect(screen.getByText("Analytics workspace")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Property intelligence for valuation and market analysis"
      })
    ).toBeTruthy();
  });
});
