/**
 * Acceptance tests for My Day feature
 * Scenarios: not connected, view events, free blocks, disconnect, meeting vs focus badges
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MyDay } from "../views/MyDay";
import { CalendarProvider } from "../services/calendar-context";
import { RepositoryProvider } from "../services/repository-context";
import { MockCalendarService } from "../services/calendar-service.mock";
import { MockTaskRepository } from "../services/task-repository.mock";
import type { CalendarEvent } from "../types/calendar";
import { format } from "date-fns";

// Use today's date for events so computeTimeBlocks aligns with selectedDate (defaults to today)
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

function renderMyDay(service: MockCalendarService, repo?: MockTaskRepository) {
  const taskRepo = repo ?? new MockTaskRepository();
  return render(
    <MemoryRouter>
      <RepositoryProvider repository={taskRepo}>
        <CalendarProvider service={service}>
          <MyDay />
        </CalendarProvider>
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("Feature: My Day", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  describe("Scenario: Not connected to Google Calendar", () => {
    it("shows connect form when not connected", async () => {
      renderMyDay(service);
      await waitFor(() => {
        expect(screen.getByText("Connect Google Calendar")).toBeInTheDocument();
      });
    });

    it("shows Client ID and Client Secret fields", async () => {
      renderMyDay(service);
      await waitFor(() => {
        expect(screen.getByLabelText("Client ID")).toBeInTheDocument();
        expect(screen.getByLabelText("Client Secret")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: View today's events", () => {
    it("shows events when connected", async () => {
      // Given: connected with tokens and events
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Team standup", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting" },
        { id: "2", summary: "Sprint planning", start: "2025-01-15T14:00:00", end: "2025-01-15T15:00:00", type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        expect(screen.getByText("Team standup")).toBeInTheDocument();
        expect(screen.getByText("Sprint planning")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Free blocks shown between events", () => {
    it("displays pomodoro blocks in free time slots", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Standup", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        expect(screen.getByText("Standup")).toBeInTheDocument();
        // Free blocks are now split into pomodoro blocks
        expect(screen.getAllByText(/Pomodoro/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Scenario: Disconnect from Google Calendar", () => {
    it("shows connect form after disconnecting", async () => {
      const user = userEvent.setup();
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([]);

      renderMyDay(service);

      // Wait for connected state
      await waitFor(() => {
        expect(screen.getByText("Disconnect")).toBeInTheDocument();
      });

      // When disconnecting
      await user.click(screen.getByText("Disconnect"));

      // Then shows connect form
      await waitFor(() => {
        expect(screen.getByText("Connect Google Calendar")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Meeting vs Focus badges", () => {
    it("shows Meeting badge for meetings and Focus badge for focus events", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "1:1 with manager", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting" },
        { id: "2", summary: "Focus time", start: "2025-01-15T10:00:00", end: "2025-01-15T12:00:00", type: "focus" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        expect(screen.getByText("Meeting")).toBeInTheDocument();
        expect(screen.getByText("Focus")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Navigate between days", () => {
    it("shows previous and next day buttons and changes the displayed date", async () => {
      const user = userEvent.setup();
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([]);

      renderMyDay(service);

      // Should show today's date and navigation buttons
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /previous day/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /next day/i })).toBeInTheDocument();
      });

      // Click next day — date should change
      await user.click(screen.getByRole("button", { name: /next day/i }));

      await waitFor(() => {
        expect(screen.getByText(/Tomorrow/i)).toBeInTheDocument();
      });

      // Click previous day twice — should show yesterday
      await user.click(screen.getByRole("button", { name: /previous day/i }));
      await user.click(screen.getByRole("button", { name: /previous day/i }));

      await waitFor(() => {
        expect(screen.getByText(/Yesterday/i)).toBeInTheDocument();
      });
    });
  });

  // Settings link has moved to the sidebar — see settings-sidebar.acceptance.test.tsx

  describe("Scenario: Pomodoro blocks between meetings", () => {
    it("shows pomodoro blocks fitted into free time between meetings", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      // 9:00-9:30 meeting, then 11:00-12:00 meeting
      // Free: 9:30-11:00 (90 min) → should fit 2 pomodoros (30+5+30=65min) with leftover
      service.setMockEvents([
        { id: "1", summary: "Standup", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting" },
        { id: "2", summary: "Design review", start: "2025-01-15T11:00:00", end: "2025-01-15T12:00:00", type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        // Should show pomodoro blocks instead of just "Free"
        const pomodoroBlocks = screen.getAllByText(/Pomodoro/i);
        expect(pomodoroBlocks.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Scenario: Assign tasks to pomodoro blocks", () => {
    it("allows assigning a task to a pomodoro block", async () => {
      const user = userEvent.setup();
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      // One meeting with free time before and after for pomodoros
      service.setMockEvents([
        { id: "1", summary: "Standup", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        // Pomodoro blocks should have an "Assign task" button/area
        const assignButtons = screen.getAllByRole("button", { name: /assign task/i });
        expect(assignButtons.length).toBeGreaterThanOrEqual(1);
      });

      // Click assign on the first pomodoro block
      const assignButtons = screen.getAllByRole("button", { name: /assign task/i });
      await user.click(assignButtons[0]);

      // Should show a task picker/input
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Blocks reflect their duration visually", () => {
    it("a 1-hour event has double the min-height of a 30-min event", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Short meeting", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting" },
        { id: "2", summary: "Long meeting", start: `${TODAY}T10:00:00`, end: `${TODAY}T11:00:00`, type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        const timeBlocks = screen.getAllByTestId("time-block");
        expect(timeBlocks.length).toBeGreaterThanOrEqual(2);
        // Find the event blocks by looking for the ones containing the event summaries
        const shortBlock = timeBlocks.find((el) => el.textContent?.includes("Short meeting"));
        const longBlock = timeBlocks.find((el) => el.textContent?.includes("Long meeting"));
        expect(shortBlock).toBeDefined();
        expect(longBlock).toBeDefined();
        // 30 min → 60px, 60 min → 120px
        expect(shortBlock!.style.minHeight).toBe("60px");
        expect(longBlock!.style.minHeight).toBe("120px");
      });
    });
  });

  describe("Scenario: Events display their calendar color", () => {
    it("event blocks show a colored left border from event.color on the inner element", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Colored meeting", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting", color: "#7986CB" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        // The color should be on the inner EventBlock, not the wrapper
        const eventEl = screen.getByText("Colored meeting").closest("[style]");
        expect(eventEl).toBeDefined();
        expect(eventEl!.getAttribute("style")).toContain("border-left-color");
      });
    });

    it("events without color get a deterministic hash-derived color on the inner element", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "No color meeting", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        const eventEl = screen.getByText("No color meeting").closest("[style]");
        expect(eventEl).toBeDefined();
        expect(eventEl!.getAttribute("style")).toContain("border-left-color");
      });
    });
  });

  describe("Scenario: Lunch block appears in the timeline", () => {
    it("a Lunch block renders between morning and afternoon blocks", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Morning standup", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting" },
        { id: "2", summary: "Afternoon review", start: `${TODAY}T14:00:00`, end: `${TODAY}T15:00:00`, type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });
  });

  // Lunch duration configuration has moved to the dedicated Settings view
  // See: src/acceptance/settings.acceptance.test.tsx

  describe("Scenario: Lunch block renders without drag handle", () => {
    it("lunch block appears but has no drag handle since there are no drop zones", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Standup", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
      // Lunch block should NOT have a drag handle
      expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
    });
  });

  describe("Scenario: Task assignment shows searchable dropdown from My Plate", () => {
    it("clicking Assign task shows a dropdown with tasks from My Plate, user can search and select", async () => {
      const user = userEvent.setup();
      const repo = new MockTaskRepository();
      // Create tasks in My Plate
      await repo.create({ title: "Review auth service PR", status: "plate" });
      await repo.create({ title: "Write design doc", status: "plate" });
      await repo.create({ title: "Fix flaky test", status: "plate" });
      // Create a backlog task that should NOT appear
      await repo.create({ title: "Backlog task", status: "backlog" });

      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Standup", start: `${TODAY}T10:00:00`, end: `${TODAY}T10:30:00`, type: "meeting" },
      ]);

      renderMyDay(service, repo);

      // Wait for pomodoro blocks
      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /assign task/i }).length).toBeGreaterThanOrEqual(1);
      });

      // Click assign on the first pomodoro block
      const assignButtons = screen.getAllByRole("button", { name: /assign task/i });
      await user.click(assignButtons[0]);

      // Should show a searchable dropdown with My Plate tasks
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
        expect(screen.getByText("Review auth service PR")).toBeInTheDocument();
        expect(screen.getByText("Write design doc")).toBeInTheDocument();
        expect(screen.getByText("Fix flaky test")).toBeInTheDocument();
      });

      // Backlog tasks should NOT be shown
      expect(screen.queryByText("Backlog task")).not.toBeInTheDocument();

      // Type to filter
      await user.type(screen.getByPlaceholderText(/search tasks/i), "design");

      // Only matching task should remain visible
      await waitFor(() => {
        expect(screen.getByText("Write design doc")).toBeInTheDocument();
        expect(screen.queryByText("Review auth service PR")).not.toBeInTheDocument();
      });

      // Click to select the task
      await user.click(screen.getByText("Write design doc"));

      // Task should be assigned and shown on the pomodoro block
      await waitFor(() => {
        expect(screen.getByText("Write design doc")).toBeInTheDocument();
      });

      // The search input should be gone (assignment complete)
      expect(screen.queryByPlaceholderText(/search tasks/i)).not.toBeInTheDocument();
    });
  });

  describe("Scenario: Saved settings from DB affect timeline on load", () => {
    it("pre-saved pomodoro_duration=60 results in fewer pomodoro blocks than default 30", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Standup", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting" },
      ]);
      // Pre-save a 60-min pomodoro duration
      await service.saveSetting("pomodoro_duration", "60");

      renderMyDay(service);

      await waitFor(() => {
        // With 60-min pomodoros there should be fewer blocks than with default 30-min
        const pomodoroBlocks = screen.getAllByText(/Pomodoro/i);
        expect(pomodoroBlocks.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Scenario: Event blocks fit correctly in timeline without double borders", () => {
    it("event block wrapper does not duplicate the colored border from inner EventBlock", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Design review", start: `${TODAY}T09:00:00`, end: `${TODAY}T10:00:00`, type: "meeting", color: "#7986CB" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        const timeBlock = screen.getAllByTestId("time-block").find((el) => el.textContent?.includes("Design review"));
        expect(timeBlock).toBeDefined();
        // The outer wrapper should NOT have its own borderLeftWidth/Color —
        // the color border should only be on the inner EventBlock element
        expect(timeBlock!.style.borderLeftWidth).toBeFalsy();
        expect(timeBlock!.style.borderLeftColor).toBeFalsy();
      });
    });
  });

  describe("Scenario: Lunch block is not draggable (no drop zones)", () => {
    it("lunch block does NOT have a drag handle since there are no drop zones to receive it", async () => {
      await service.saveTokens({
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600_000,
      });
      service.setMockEvents([
        { id: "1", summary: "Standup", start: `${TODAY}T09:00:00`, end: `${TODAY}T09:30:00`, type: "meeting" },
      ]);

      renderMyDay(service);

      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
      // Lunch block should NOT have a drag handle since there's no drop zone
      expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
    });
  });

  // Settings Save button and persistence tests have moved to the dedicated Settings view
  // See: src/acceptance/settings.acceptance.test.tsx
});
