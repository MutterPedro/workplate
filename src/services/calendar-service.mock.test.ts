import { describe, it, expect, beforeEach } from "vitest";
import { MockCalendarService } from "./calendar-service.mock";
import { computeTimeBlocks, classifyEvent, computeBlockHeight, eventColor, insertLunchBlock, reorderTaskAssignments, moveLunchBlock } from "./calendar-service";
import type { CalendarEvent, TimeBlock } from "../types/calendar";

describe("MockCalendarService", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it("starts disconnected with no tokens", async () => {
    const tokens = await service.getTokens();
    expect(tokens).toBeNull();
  });

  it("saves and retrieves tokens", async () => {
    const tokens = {
      accessToken: "access-123",
      refreshToken: "refresh-456",
      expiresAt: Date.now() + 3600_000,
    };
    await service.saveTokens(tokens);
    const retrieved = await service.getTokens();
    expect(retrieved).toEqual(tokens);
  });

  it("clears tokens on disconnect", async () => {
    await service.saveTokens({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 3600_000,
    });
    await service.clearTokens();
    const tokens = await service.getTokens();
    expect(tokens).toBeNull();
  });

  it("exchanges auth code for tokens", async () => {
    const tokens = await service.exchangeAuthCode("test-code", "client-id", "client-secret");
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());
  });

  it("refreshes an expired token", async () => {
    const tokens = await service.refreshAccessToken("old-refresh", "client-id", "client-secret");
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());
  });

  it("fetches today's events", async () => {
    service.setMockEvents([
      { id: "1", summary: "Standup", start: "2025-01-15T09:00:00Z", end: "2025-01-15T09:30:00Z", type: "meeting" },
      { id: "2", summary: "Focus time", start: "2025-01-15T10:00:00Z", end: "2025-01-15T12:00:00Z", type: "focus" },
    ]);
    const events = await service.fetchTodayEvents("access-token");
    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe("Standup");
  });

  it("saves and retrieves settings", async () => {
    await service.saveSetting("google_client_id", "my-client-id");
    const value = await service.getSetting("google_client_id");
    expect(value).toBe("my-client-id");
  });

  it("returns null for missing setting", async () => {
    const value = await service.getSetting("nonexistent");
    expect(value).toBeNull();
  });
});

describe("classifyEvent", () => {
  it('classifies events with attendees as "meeting"', () => {
    expect(classifyEvent("Team standup", 3)).toBe("meeting");
  });

  it('classifies events with "focus" in title as "focus"', () => {
    expect(classifyEvent("Focus time", 0)).toBe("focus");
  });

  it('classifies events with "deep work" in title as "focus"', () => {
    expect(classifyEvent("Deep Work block", 0)).toBe("focus");
  });

  it('classifies other events as "other"', () => {
    expect(classifyEvent("Lunch", 0)).toBe("other");
  });
});

describe("computePomodoroBlocks", () => {
  // Import will be added to production code
  let computePomodoroBlocks: typeof import("./calendar-service").computePomodoroBlocks;

  beforeEach(async () => {
    const mod = await import("./calendar-service");
    computePomodoroBlocks = mod.computePomodoroBlocks;
  });

  it("splits a free block into pomodoro and rest blocks", () => {
    const timeBlocks: import("../types/calendar").TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T10:10:00", kind: "free" },
    ];
    // 70 min free → 30 min pomodoro + 5 min rest + 30 min pomodoro + 5 min leftover (too short for another pomodoro)
    const result = computePomodoroBlocks(timeBlocks, { pomodoroDuration: 30, restDuration: 5 });
    const pomodoros = result.filter((b) => b.kind === "pomodoro");
    const rests = result.filter((b) => b.kind === "rest");
    expect(pomodoros).toHaveLength(2);
    expect(rests).toHaveLength(1); // rest between pomodoros, no trailing rest after last
    expect(pomodoros[0].start).toBe("2025-01-15T09:00:00");
    expect(pomodoros[0].end).toBe("2025-01-15T09:30:00");
    expect(rests[0].start).toBe("2025-01-15T09:30:00");
    expect(rests[0].end).toBe("2025-01-15T09:35:00");
    expect(pomodoros[1].start).toBe("2025-01-15T09:35:00");
    expect(pomodoros[1].end).toBe("2025-01-15T10:05:00");
  });

  it("preserves event blocks unchanged", () => {
    const event: import("../types/calendar").CalendarEvent = {
      id: "1", summary: "Standup", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting",
    };
    const timeBlocks: import("../types/calendar").TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "event", event },
    ];
    const result = computePomodoroBlocks(timeBlocks, { pomodoroDuration: 30, restDuration: 5 });
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("event");
    expect(result[0].event).toBe(event);
  });

  it("leaves leftover free time shorter than a pomodoro as free", () => {
    const timeBlocks: import("../types/calendar").TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:20:00", kind: "free" },
    ];
    // 20 min free < 30 min pomodoro → stays as free
    const result = computePomodoroBlocks(timeBlocks, { pomodoroDuration: 30, restDuration: 5 });
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("free");
  });

  it("fits exactly one pomodoro with no rest needed after", () => {
    const timeBlocks: import("../types/calendar").TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "free" },
    ];
    const result = computePomodoroBlocks(timeBlocks, { pomodoroDuration: 30, restDuration: 5 });
    const pomodoros = result.filter((b) => b.kind === "pomodoro");
    const rests = result.filter((b) => b.kind === "rest");
    expect(pomodoros).toHaveLength(1);
    expect(rests).toHaveLength(0); // no rest after last pomodoro
  });

  it("handles mixed event and free blocks", () => {
    const event: import("../types/calendar").CalendarEvent = {
      id: "1", summary: "Standup", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting",
    };
    const timeBlocks: import("../types/calendar").TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "event", event },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T11:00:00", kind: "free" }, // 90 min
    ];
    // 90 min → 30 pom + 5 rest + 30 pom + 25 min leftover (not enough for 30+5)
    const result = computePomodoroBlocks(timeBlocks, { pomodoroDuration: 30, restDuration: 5 });
    expect(result[0].kind).toBe("event");
    const pomodoros = result.filter((b) => b.kind === "pomodoro");
    expect(pomodoros).toHaveLength(2);
  });
});

describe("computeTimeBlocks", () => {
  it("returns free block for entire day when no events", () => {
    const blocks = computeTimeBlocks([], "2025-01-15");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("free");
    expect(blocks[0].start).toBe("2025-01-15T09:00:00");
    expect(blocks[0].end).toBe("2025-01-15T17:00:00");
  });

  it("computes free blocks around events", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Standup", start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", type: "meeting" },
    ];
    const blocks = computeTimeBlocks(events, "2025-01-15");
    // free 9:00-10:00, event 10:00-10:30, free 10:30-17:00
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ start: "2025-01-15T09:00:00", end: "2025-01-15T10:00:00", kind: "free" });
    expect(blocks[1]).toEqual({ start: "2025-01-15T10:00:00", end: "2025-01-15T10:30:00", kind: "event", event: events[0] });
    expect(blocks[2]).toEqual({ start: "2025-01-15T10:30:00", end: "2025-01-15T17:00:00", kind: "free" });
  });

  it("handles back-to-back events with no gap", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Meeting A", start: "2025-01-15T09:00:00", end: "2025-01-15T10:00:00", type: "meeting" },
      { id: "2", summary: "Meeting B", start: "2025-01-15T10:00:00", end: "2025-01-15T11:00:00", type: "meeting" },
    ];
    const blocks = computeTimeBlocks(events, "2025-01-15");
    // event A, event B, free 11:00-17:00
    expect(blocks).toHaveLength(3);
    expect(blocks[0].kind).toBe("event");
    expect(blocks[1].kind).toBe("event");
    expect(blocks[2].kind).toBe("free");
  });

  it("handles event spanning entire working day", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "All day", start: "2025-01-15T09:00:00", end: "2025-01-15T17:00:00", type: "other" },
    ];
    const blocks = computeTimeBlocks(events, "2025-01-15");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("event");
  });
});

describe("computeBlockHeight", () => {
  it("returns 60px for a 30-minute block at 2px/min", () => {
    expect(computeBlockHeight("2025-01-15T09:00:00", "2025-01-15T09:30:00", 2)).toBe(60);
  });

  it("returns 120px for a 1-hour block at 2px/min", () => {
    expect(computeBlockHeight("2025-01-15T09:00:00", "2025-01-15T10:00:00", 2)).toBe(120);
  });

  it("returns 45px for a 15-minute block at 3px/min", () => {
    expect(computeBlockHeight("2025-01-15T09:00:00", "2025-01-15T09:15:00", 3)).toBe(45);
  });
});

describe("eventColor", () => {
  it("maps Google colorId 1 to lavender (#7986CB)", () => {
    expect(eventColor("1")).toBe("#7986CB");
  });

  it("maps Google colorId 9 to blueberry (#3F51B5)", () => {
    expect(eventColor("9")).toBe("#3F51B5");
  });

  it("maps Google colorId 11 to tomato (#D50000)", () => {
    expect(eventColor("11")).toBe("#D50000");
  });

  it("generates a deterministic hex color from summary when no colorId", () => {
    const color = eventColor(undefined, "Team standup");
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("generates the same color for the same summary", () => {
    const color1 = eventColor(undefined, "Team standup");
    const color2 = eventColor(undefined, "Team standup");
    expect(color1).toBe(color2);
  });

  it("generates different colors for different summaries", () => {
    const color1 = eventColor(undefined, "Team standup");
    const color2 = eventColor(undefined, "Sprint planning");
    expect(color1).not.toBe(color2);
  });

  it("returns a default color when no colorId and no summary", () => {
    const color = eventColor();
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe("insertLunchBlock", () => {
  it("splits a free block containing noon into free+lunch+free", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T17:00:00", kind: "free" },
    ];
    const result = insertLunchBlock(blocks, "12:00", 60);
    const lunch = result.find((b) => b.kind === "lunch");
    expect(lunch).toBeDefined();
    expect(lunch!.start).toBe("2025-01-15T12:00:00");
    expect(lunch!.end).toBe("2025-01-15T13:00:00");
    // Should have free before, lunch, free after
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("free");
    expect(result[0].end).toBe("2025-01-15T12:00:00");
    expect(result[2].kind).toBe("free");
    expect(result[2].start).toBe("2025-01-15T13:00:00");
  });

  it("skips insertion if lunch overlaps an event", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T11:00:00", end: "2025-01-15T13:00:00", kind: "event", event: { id: "1", summary: "Meeting", start: "2025-01-15T11:00:00", end: "2025-01-15T13:00:00", type: "meeting" } },
      { start: "2025-01-15T13:00:00", end: "2025-01-15T17:00:00", kind: "free" },
    ];
    const result = insertLunchBlock(blocks, "12:00", 60);
    // Lunch would overlap the event, so no lunch block inserted
    expect(result.find((b) => b.kind === "lunch")).toBeUndefined();
  });

  it("respects configurable duration (30 min lunch)", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T17:00:00", kind: "free" },
    ];
    const result = insertLunchBlock(blocks, "12:00", 30);
    const lunch = result.find((b) => b.kind === "lunch");
    expect(lunch!.start).toBe("2025-01-15T12:00:00");
    expect(lunch!.end).toBe("2025-01-15T12:30:00");
  });

  it("handles lunch at the start of a free block", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T12:00:00", end: "2025-01-15T17:00:00", kind: "free" },
    ];
    const result = insertLunchBlock(blocks, "12:00", 60);
    expect(result[0].kind).toBe("lunch");
    expect(result[1].kind).toBe("free");
    expect(result).toHaveLength(2);
  });

  it("handles lunch at the end of a free block", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T13:00:00", kind: "free" },
    ];
    const result = insertLunchBlock(blocks, "12:00", 60);
    expect(result[0].kind).toBe("free");
    expect(result[1].kind).toBe("lunch");
    expect(result).toHaveLength(2);
  });

  it("preserves event blocks unchanged", () => {
    const event: CalendarEvent = { id: "1", summary: "Standup", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting" };
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "event", event },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T17:00:00", kind: "free" },
    ];
    const result = insertLunchBlock(blocks, "12:00", 60);
    expect(result[0].kind).toBe("event");
    expect(result[0].event).toBe(event);
  });
});

describe("reorderTaskAssignments", () => {
  it("swaps task assignments between two pomodoro blocks", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro", assignedTask: "Task A" },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T09:35:00", kind: "rest" },
      { start: "2025-01-15T09:35:00", end: "2025-01-15T10:05:00", kind: "pomodoro", assignedTask: "Task B" },
    ];
    const result = reorderTaskAssignments(blocks, 0, 1);
    const pomodoros = result.filter((b) => b.kind === "pomodoro");
    expect(pomodoros[0].assignedTask).toBe("Task B");
    expect(pomodoros[1].assignedTask).toBe("Task A");
  });

  it("preserves pomodoro block times (only assignments change)", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro", assignedTask: "Task A" },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T09:35:00", kind: "rest" },
      { start: "2025-01-15T09:35:00", end: "2025-01-15T10:05:00", kind: "pomodoro", assignedTask: "Task B" },
    ];
    const result = reorderTaskAssignments(blocks, 0, 1);
    expect(result[0].start).toBe("2025-01-15T09:00:00");
    expect(result[2].start).toBe("2025-01-15T09:35:00");
  });

  it("keeps rest blocks unaffected", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "pomodoro", assignedTask: "Task A" },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T09:35:00", kind: "rest" },
      { start: "2025-01-15T09:35:00", end: "2025-01-15T10:05:00", kind: "pomodoro", assignedTask: "Task B" },
    ];
    const result = reorderTaskAssignments(blocks, 0, 1);
    expect(result[1].kind).toBe("rest");
    expect(result[1].assignedTask).toBeUndefined();
  });

  it("ignores non-pomodoro blocks in the reorder indices", () => {
    const blocks: TimeBlock[] = [
      { start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", kind: "event", event: { id: "1", summary: "Meeting", start: "2025-01-15T09:00:00", end: "2025-01-15T09:30:00", type: "meeting" } },
      { start: "2025-01-15T09:30:00", end: "2025-01-15T10:00:00", kind: "pomodoro", assignedTask: "Task A" },
      { start: "2025-01-15T10:00:00", end: "2025-01-15T10:05:00", kind: "rest" },
      { start: "2025-01-15T10:05:00", end: "2025-01-15T10:35:00", kind: "pomodoro", assignedTask: "Task B" },
    ];
    const result = reorderTaskAssignments(blocks, 0, 1);
    // Pomodoro index 0 and 1 should swap
    const pomodoros = result.filter((b) => b.kind === "pomodoro");
    expect(pomodoros[0].assignedTask).toBe("Task B");
    expect(pomodoros[1].assignedTask).toBe("Task A");
    // Event unchanged
    expect(result[0].kind).toBe("event");
  });
});

describe("moveLunchBlock", () => {
  it("moves lunch to a new time", () => {
    const result = moveLunchBlock("12:00", "13:00", [], "2025-01-15");
    expect(result).toBe("13:00");
  });

  it("returns original time if new time overlaps an event", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Meeting", start: "2025-01-15T13:00:00", end: "2025-01-15T14:00:00", type: "meeting" },
    ];
    const result = moveLunchBlock("12:00", "13:00", events, "2025-01-15", 60);
    expect(result).toBe("12:00");
  });

  it("allows moving to a gap between events", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Meeting", start: "2025-01-15T09:00:00", end: "2025-01-15T10:00:00", type: "meeting" },
      { id: "2", summary: "Meeting 2", start: "2025-01-15T14:00:00", end: "2025-01-15T15:00:00", type: "meeting" },
    ];
    const result = moveLunchBlock("12:00", "11:00", events, "2025-01-15", 60);
    expect(result).toBe("11:00");
  });
});
