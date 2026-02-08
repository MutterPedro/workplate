import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MyDay } from "./MyDay";
import { CalendarProvider } from "../services/calendar-context";
import { MockCalendarService } from "../services/calendar-service.mock";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

function renderMyDay(service: MockCalendarService) {
  return render(
    <MemoryRouter>
      <CalendarProvider service={service}>
        <MyDay />
      </CalendarProvider>
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

describe("MyDay view — Settings", () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it("renders a settings button", async () => {
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });
  });

  it("shows settings panel with working hours and pomodoro fields when clicked", async () => {
    const user = userEvent.setup();
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /settings/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/work start/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/work end/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pomodoro.*duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rest.*duration/i)).toBeInTheDocument();
    });
  });

  it("persists changed pomodoro duration via the calendar service", async () => {
    const user = userEvent.setup();
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /settings/i }));

    const pomodoroInput = screen.getByLabelText(/pomodoro.*duration/i);
    await user.clear(pomodoroInput);
    await user.type(pomodoroInput, "25");

    // Value should have been saved to the service
    await waitFor(async () => {
      const saved = await service.getSetting("pomodoro_duration");
      expect(saved).toBe("25");
    });
  });

  it("loads previously saved settings on mount", async () => {
    const user = userEvent.setup();
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);
    // Pre-set a saved pomodoro duration
    await service.saveSetting("pomodoro_duration", "45");
    await service.saveSetting("rest_duration", "10");

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /settings/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/pomodoro.*duration/i)).toHaveValue(45);
      expect(screen.getByLabelText(/rest.*duration/i)).toHaveValue(10);
    });
  });

  it("shows default values: pomodoro 30 min, rest 5 min", async () => {
    const user = userEvent.setup();
    await service.saveTokens({
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600_000,
    });
    service.setMockEvents([]);

    renderMyDay(service);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /settings/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/pomodoro.*duration/i)).toHaveValue(30);
      expect(screen.getByLabelText(/rest.*duration/i)).toHaveValue(5);
    });
  });
});
