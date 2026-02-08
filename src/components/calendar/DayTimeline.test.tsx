import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DayTimeline } from "./DayTimeline";
import type { TimeBlock } from "../../types/calendar";

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

describe("DayTimeline", () => {
  it("renders a message when there are no blocks", () => {
    render(<DayTimeline blocks={[]} />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it("renders free blocks", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T12:00:00", kind: "free" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText(/free/i)).toBeInTheDocument();
    expect(screen.getByText("9:00 AM")).toBeInTheDocument();
    expect(screen.getByText("12:00 PM")).toBeInTheDocument();
  });

  it("renders event blocks with summary", () => {
    const blocks: TimeBlock[] = [
      {
        start: "2025-01-15T10:00:00",
        end: "2025-01-15T10:30:00",
        kind: "event",
        event: { id: "1", summary: "Team standup", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
      },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText("Team standup")).toBeInTheDocument();
  });

  it("shows meeting badge for meeting events", () => {
    const blocks: TimeBlock[] = [
      {
        start: "2025-01-15T10:00:00",
        end: "2025-01-15T10:30:00",
        kind: "event",
        event: { id: "1", summary: "1:1", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
      },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText("Meeting")).toBeInTheDocument();
  });

  it("shows focus badge for focus events", () => {
    const blocks: TimeBlock[] = [
      {
        start: "2025-01-15T10:00:00",
        end: "2025-01-15T12:00:00",
        kind: "event",
        event: { id: "2", summary: "Focus time", start: "2025-01-15T10:00:00", end: "2025-01-15T12:00:00", type: "focus" },
      },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText("Focus")).toBeInTheDocument();
  });

  it("renders multiple blocks in order", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T10:00:00", kind: "free" },
      {
        start: "2025-01-15T10:00:00",
        end: "2025-01-15T10:30:00",
        kind: "event",
        event: { id: "1", summary: "Standup", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
      },
      { start: "2025-01-15T10:30:00", end: "2025-01-15T17:00:00", kind: "free" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText("Standup")).toBeInTheDocument();
    expect(screen.getAllByText(/free/i)).toHaveLength(2);
  });

  it("renders pomodoro blocks with 'Pomodoro' label", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro" },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T09:35:00", kind: "rest" },
      { start: "2025-01-15T09:35:00", end: "2025-01-15T10:05:00", kind: "pomodoro" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getAllByText(/Pomodoro/i)).toHaveLength(2);
    expect(screen.getByText(/Rest/i)).toBeInTheDocument();
  });

  it("renders 'Assign task' button on pomodoro blocks", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro" },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T09:35:00", kind: "rest" },
      { start: "2025-01-15T09:35:00", end: "2025-01-15T10:05:00", kind: "pomodoro" },
    ];
    render(<DayTimeline blocks={blocks} />);
    const assignButtons = screen.getAllByRole("button", { name: /assign task/i });
    expect(assignButtons).toHaveLength(2); // one per pomodoro, not on rest
  });

  it("shows task search input when 'Assign task' is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro" },
    ];
    render(<DayTimeline blocks={blocks} />);
    const assignBtn = screen.getByRole("button", { name: /assign task/i });
    await user.click(assignBtn);
    expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
  });

  it("displays assigned task name on pomodoro block", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro", assignedTask: "Build login page" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText("Build login page")).toBeInTheDocument();
    // When a task is assigned, the assign button should not be shown
    expect(screen.queryByRole("button", { name: /assign task/i })).not.toBeInTheDocument();
  });

  it("renders blocks with data-testid='time-block' and proportional minHeight", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro" }, // 30 min → 60px
      { start: "2025-01-15T09:30:00", end: "2025-01-15T10:30:00", kind: "free" },      // 60 min → 120px
    ];
    render(<DayTimeline blocks={blocks} />);
    const timeBlocks = screen.getAllByTestId("time-block");
    expect(timeBlocks).toHaveLength(2);
    expect(timeBlocks[0].style.minHeight).toBe("60px");
    expect(timeBlocks[1].style.minHeight).toBe("120px");
  });

  it("event block wrapper does not have border-left styling (only inner EventBlock does)", () => {
    const blocks: TimeBlock[] = [
      {
        start: "2025-01-15T10:00:00",
        end: "2025-01-15T10:30:00",
        kind: "event",
        event: { id: "1", summary: "Standup", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting", color: "#7986CB" },
      },
    ];
    render(<DayTimeline blocks={blocks} />);
    const timeBlock = screen.getByTestId("time-block");
    // The outer wrapper should NOT have border-left styling — only the inner EventBlock should
    expect(timeBlock.style.borderLeftWidth).toBeFalsy();
    expect(timeBlock.style.borderLeftColor).toBeFalsy();
  });

  it("renders lunch block with 'Lunch' label", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T12:00:00", end: "2025-01-15T13:00:00", kind: "lunch" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.getByText("Lunch")).toBeInTheDocument();
  });

  it("lunch block does not have a drag handle since there are no drop zones", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T12:00:00", end: "2025-01-15T13:00:00", kind: "lunch" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
  });

  it("event blocks do NOT have drag handles", () => {
    const blocks: TimeBlock[] = [
      {
        start: "2025-01-15T10:00:00",
        end: "2025-01-15T10:30:00",
        kind: "event",
        event: { id: "1", summary: "Meeting", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
      },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
  });

  it("rest blocks do NOT have drag handles", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:30:00", end: "2025-01-15T09:35:00", kind: "rest" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
  });

  it("free blocks do NOT have drag handles", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T10:00:00", kind: "free" },
    ];
    render(<DayTimeline blocks={blocks} />);
    expect(screen.queryByTestId("drag-handle")).not.toBeInTheDocument();
  });
});
