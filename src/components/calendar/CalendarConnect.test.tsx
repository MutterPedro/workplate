import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarConnect } from "./CalendarConnect";

describe("CalendarConnect", () => {
  const defaultProps = {
    connected: false,
    loading: false,
    error: null as string | null,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    onSaveConfig: vi.fn(),
    clientId: "",
    clientSecret: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows connect button when not connected", () => {
    render(<CalendarConnect {...defaultProps} />);
    expect(screen.getByText("Connect Google Calendar")).toBeInTheDocument();
  });

  it("shows config form fields for Client ID and Secret", () => {
    render(<CalendarConnect {...defaultProps} />);
    expect(screen.getByLabelText("Client ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Client Secret")).toBeInTheDocument();
  });

  it("disables connect button when config is empty", () => {
    render(<CalendarConnect {...defaultProps} />);
    expect(screen.getByText("Connect Google Calendar")).toBeDisabled();
  });

  it("enables connect button when config is filled", () => {
    render(<CalendarConnect {...defaultProps} clientId="id" clientSecret="secret" />);
    expect(screen.getByText("Connect Google Calendar")).toBeEnabled();
  });

  it("calls onSaveConfig when inputs change", async () => {
    const user = userEvent.setup();
    render(<CalendarConnect {...defaultProps} />);

    await user.type(screen.getByLabelText("Client ID"), "my-id");
    expect(defaultProps.onSaveConfig).toHaveBeenCalled();
  });

  it("calls onConnect when connect button is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarConnect {...defaultProps} clientId="id" clientSecret="secret" />);
    await user.click(screen.getByText("Connect Google Calendar"));
    expect(defaultProps.onConnect).toHaveBeenCalled();
  });

  it("shows disconnect button when connected", () => {
    render(<CalendarConnect {...defaultProps} connected={true} />);
    expect(screen.getByText("Disconnect")).toBeInTheDocument();
    expect(screen.queryByText("Connect Google Calendar")).not.toBeInTheDocument();
  });

  it("calls onDisconnect when disconnect button is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarConnect {...defaultProps} connected={true} />);
    await user.click(screen.getByText("Disconnect"));
    expect(defaultProps.onDisconnect).toHaveBeenCalled();
  });

  it("shows loading spinner when loading", () => {
    render(<CalendarConnect {...defaultProps} loading={true} />);
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("shows error message when error is set", () => {
    render(<CalendarConnect {...defaultProps} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
