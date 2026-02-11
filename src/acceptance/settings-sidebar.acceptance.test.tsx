/**
 * Acceptance tests for Settings in the sidebar
 * Settings should always be accessible from the sidebar navigation.
 * The settings button should NOT appear in MyDay.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Shell } from "../components/layout/Shell";
import { CalendarProvider } from "../services/calendar-context";
import { RepositoryProvider } from "../services/repository-context";
import { MockCalendarService } from "../services/calendar-service.mock";
import { MockTaskRepository } from "../services/task-repository.mock";
import { MyDay } from "../views/MyDay";
import { Settings } from "../views/Settings";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

// Mock dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
}));

function renderApp(service: MockCalendarService, initialRoute = "/my-day") {
  const repo = new MockTaskRepository();
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <RepositoryProvider repository={repo}>
        <CalendarProvider service={service}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/my-day" element={<MyDay />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </CalendarProvider>
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("Feature: Settings in Sidebar", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  describe("Scenario: Settings link is always visible in the sidebar", () => {
    it("the sidebar contains a Settings navigation link", async () => {
      renderApp(service);

      const sidebar = screen.getByTestId("sidebar");
      const settingsLink = sidebar.querySelector('a[href="/settings"]');
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveTextContent(/settings/i);
    });
  });

  describe("Scenario: MyDay no longer has a settings button", () => {
    it("MyDay does not render a settings link or button", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([]);

      renderApp(service, "/my-day");

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /my day/i })).toBeInTheDocument();
      });

      // The main content area should NOT have a settings link/button
      // The only settings link should be in the sidebar
      const mainContent = screen.getByRole("main");
      const settingsInMain = mainContent.querySelector('a[href="/settings"]');
      expect(settingsInMain).not.toBeInTheDocument();
    });
  });
});
