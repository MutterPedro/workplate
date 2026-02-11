import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  it("renders a Settings navigation link pointing to /settings", () => {
    renderSidebar();

    const sidebar = screen.getByTestId("sidebar");
    const settingsLink = sidebar.querySelector('a[href="/settings"]');
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveTextContent(/settings/i);
  });

  it("renders all four navigation links", () => {
    renderSidebar();

    const sidebar = screen.getByTestId("sidebar");
    const links = sidebar.querySelectorAll("a");
    expect(links).toHaveLength(4);

    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/backlog", "/my-day", "/settings"]);
  });
});
