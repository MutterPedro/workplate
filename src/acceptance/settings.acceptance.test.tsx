/**
 * Acceptance tests for the Settings view
 * Settings should be a dedicated route, persist to DB, and affect the My Day timeline.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { CalendarProvider } from "../services/calendar-context";
import { RepositoryProvider } from "../services/repository-context";
import { MockCalendarService } from "../services/calendar-service.mock";
import { MockTaskRepository } from "../services/task-repository.mock";
import { Settings } from "../views/Settings";
import { MyDay } from "../views/MyDay";
import { format } from "date-fns";

const TODAY = format(new Date(), "yyyy-MM-dd");

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
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: vi.fn(),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
}));

function renderApp(service: MockCalendarService, initialRoute = "/settings") {
  const repo = new MockTaskRepository();
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <RepositoryProvider repository={repo}>
        <CalendarProvider service={service}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
            <Route path="/my-day" element={<MyDay />} />
          </Routes>
        </CalendarProvider>
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("Feature: Settings View", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  describe("Scenario: Settings is a dedicated page", () => {
    it("renders a Settings heading with all configuration fields", async () => {
      renderApp(service);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/work start/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/work end/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pomodoro.*duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rest.*duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lunch.*duration/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  describe("Scenario: Settings persist to DB and survive navigation", () => {
    it("saving Work Start persists to DB", async () => {
      const user = userEvent.setup();
      renderApp(service);

      await waitFor(() => {
        expect(screen.getByLabelText(/work start/i)).toBeInTheDocument();
      });

      const workStartInput = screen.getByLabelText(/work start/i);
      await user.clear(workStartInput);
      await user.type(workStartInput, "10:00");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(async () => {
        expect(await service.getSetting("work_start")).toBe("10:00");
      });
    });

    it("loads previously saved settings from DB on mount", async () => {
      await service.saveSetting("work_start", "10:00");
      await service.saveSetting("work_end", "18:00");
      await service.saveSetting("pomodoro_duration", "45");
      await service.saveSetting("rest_duration", "10");
      await service.saveSetting("lunch_duration", "30");

      renderApp(service);

      await waitFor(() => {
        expect(screen.getByLabelText(/work start/i)).toHaveValue("10:00");
        expect(screen.getByLabelText(/work end/i)).toHaveValue("18:00");
        expect(screen.getByLabelText(/pomodoro.*duration/i)).toHaveValue(45);
        expect(screen.getByLabelText(/rest.*duration/i)).toHaveValue(10);
        expect(screen.getByLabelText(/lunch.*duration/i)).toHaveValue(30);
      });
    });
  });

  describe("Scenario: Work Start affects the My Day timeline", () => {
    it("changing Work Start to 10:00 makes the first block start at 10 AM", async () => {
      const user = userEvent.setup();

      // Pre-save tokens so My Day shows the timeline
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([]);

      // Save Work Start as 10:00 in DB
      await service.saveSetting("work_start", "10:00");

      // Render My Day directly — it should pick up work_start from DB
      renderApp(service, "/my-day");

      await waitFor(() => {
        // The first time shown on the timeline should be 10:00 AM, not 9:00 AM
        expect(screen.getByText("10:00 AM")).toBeInTheDocument();
        expect(screen.queryByText("9:00 AM")).not.toBeInTheDocument();
      });
    });
  });
});
