import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MyDay } from "./MyDay";
import { CalendarProvider } from "../services/calendar-context";
import { RepositoryProvider } from "../services/repository-context";
import { MockCalendarService } from "../services/calendar-service.mock";
import { MockTaskRepository } from "../services/task-repository.mock";
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

describe("MyDay view — Day Navigation", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it("renders previous day and next day buttons", async () => {
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /previous day/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next day/i })).toBeInTheDocument();
    });
  });

  it("shows 'Tomorrow' when clicking next day", async () => {
    const user = userEvent.setup();
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /next day/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /next day/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tomorrow/i)).toBeInTheDocument();
    });
  });

  it("shows 'Yesterday' when clicking previous day", async () => {
    const user = userEvent.setup();
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /previous day/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /previous day/i }));

    await waitFor(() => {
      expect(screen.getByText(/Yesterday/i)).toBeInTheDocument();
    });
  });
});

// Settings-specific tests have moved to Settings.test.tsx

describe("MyDay view — Task Assignment", () => {
  let service: MockCalendarService;
  let repo: MockTaskRepository;

  beforeEach(() => {
    service = new MockCalendarService();
    repo = new MockTaskRepository();
  });

  it("shows plate tasks in the dropdown when Assign task is clicked", async () => {
    const user = userEvent.setup();
    await repo.create({ title: "Review auth PR", status: "plate" });
    await repo.create({ title: "Write design doc", status: "plate" });
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

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /assign task/i }).length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByRole("button", { name: /assign task/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("Review auth PR")).toBeInTheDocument();
      expect(screen.getByText("Write design doc")).toBeInTheDocument();
    });
    // Backlog tasks should not appear
    expect(screen.queryByText("Backlog task")).not.toBeInTheDocument();
  });

  it("assigns a task to a pomodoro block when clicked", async () => {
    const user = userEvent.setup();
    await repo.create({ title: "Write design doc", status: "plate" });

    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([
      { id: "1", summary: "Standup", start: `${TODAY}T10:00:00`, end: `${TODAY}T10:30:00`, type: "meeting" },
    ]);

    renderMyDay(service, repo);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /assign task/i }).length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByRole("button", { name: /assign task/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("Write design doc")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Write design doc"));

    // After assignment, the task name should still be visible (now as the assigned task)
    await waitFor(() => {
      expect(screen.getByText("Write design doc")).toBeInTheDocument();
      // The search input should be gone
      expect(screen.queryByPlaceholderText(/search tasks/i)).not.toBeInTheDocument();
    });
  });
});

// Settings Save Button tests have moved to Settings.test.tsx

describe("MyDay view — Settings Navigation", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it("does not render a settings link or button", async () => {
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /my day/i })).toBeInTheDocument();
    });

    // Settings link should NOT be in MyDay — it's now in the sidebar
    expect(screen.queryByRole("link", { name: /settings/i })).not.toBeInTheDocument();
  });
});

describe("MyDay view — Work Hours from DB", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it("uses work_start from DB to set the timeline start time", async () => {
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);
    // Save work_start as 10:00 — timeline should start at 10 AM, not 9 AM
    await service.saveSetting("work_start", "10:00");

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByText("10:00 AM")).toBeInTheDocument();
    });
    // 9:00 AM should NOT appear in the timeline
    expect(screen.queryByText("9:00 AM")).not.toBeInTheDocument();
  });

  it("uses work_end from DB to set the timeline end time", async () => {
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);
    await service.saveSetting("work_end", "18:00");

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByText("6:00 PM")).toBeInTheDocument();
    });
  });
});
