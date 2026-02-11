import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CalendarProvider } from "../services/calendar-context";
import { MockCalendarService } from "../services/calendar-service.mock";
import { Settings } from "./Settings";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

function renderSettings(service: MockCalendarService) {
  return render(
    <MemoryRouter>
      <CalendarProvider service={service}>
        <Settings />
      </CalendarProvider>
    </MemoryRouter>,
  );
}

describe("Settings view", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it("renders a Settings heading", async () => {
    renderSettings(service);
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders all settings fields with correct defaults", async () => {
    renderSettings(service);

    await waitFor(() => {
      expect(screen.getByLabelText(/work start/i)).toHaveValue("09:00");
      expect(screen.getByLabelText(/work end/i)).toHaveValue("17:00");
      expect(screen.getByLabelText(/pomodoro.*duration/i)).toHaveValue(30);
      expect(screen.getByLabelText(/rest.*duration/i)).toHaveValue(5);
      expect(screen.getByLabelText(/lunch.*duration/i)).toHaveValue(60);
    });
  });

  it("renders a Save button", () => {
    renderSettings(service);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("loads saved values from DB on mount", async () => {
    await service.saveSetting("work_start", "10:00");
    await service.saveSetting("work_end", "18:00");
    await service.saveSetting("pomodoro_duration", "45");
    await service.saveSetting("rest_duration", "10");
    await service.saveSetting("lunch_duration", "30");

    renderSettings(service);

    await waitFor(() => {
      expect(screen.getByLabelText(/work start/i)).toHaveValue("10:00");
      expect(screen.getByLabelText(/work end/i)).toHaveValue("18:00");
      expect(screen.getByLabelText(/pomodoro.*duration/i)).toHaveValue(45);
      expect(screen.getByLabelText(/rest.*duration/i)).toHaveValue(10);
      expect(screen.getByLabelText(/lunch.*duration/i)).toHaveValue(30);
    });
  });

  it("persists all settings to DB when Save is clicked", async () => {
    const user = userEvent.setup();
    renderSettings(service);

    await waitFor(() => {
      expect(screen.getByLabelText(/work start/i)).toBeInTheDocument();
    });

    // Change work start
    const workStartInput = screen.getByLabelText(/work start/i);
    await user.clear(workStartInput);
    await user.type(workStartInput, "10:00");

    // Change pomodoro duration
    const pomInput = screen.getByLabelText(/pomodoro.*duration/i);
    await user.clear(pomInput);
    await user.type(pomInput, "25");

    // Not saved yet
    expect(await service.getSetting("work_start")).toBeNull();

    // Click Save
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(async () => {
      expect(await service.getSetting("work_start")).toBe("10:00");
      expect(await service.getSetting("pomodoro_duration")).toBe("25");
    });
  });
});
