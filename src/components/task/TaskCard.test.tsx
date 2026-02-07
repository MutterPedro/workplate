import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "./TaskCard";
import type { Task } from "../../types/task";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "test-1",
  title: "Test Task",
  description: "A test task",
  blocking: false,
  link: null,
  priority: "P2",
  project: "TestProject",
  size: "M",
  status: "plate",
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("TaskCard", () => {
  it("renders task title", () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<TaskCard task={makeTask({ description: "My description" })} />);
    expect(screen.getByText("My description")).toBeInTheDocument();
  });

  it("renders priority badge", () => {
    render(<TaskCard task={makeTask({ priority: "P0" })} />);
    expect(screen.getByTestId("priority-badge")).toHaveTextContent("P0");
  });

  it("renders size badge", () => {
    render(<TaskCard task={makeTask({ size: "XL" })} />);
    expect(screen.getByTestId("size-badge")).toHaveTextContent("XL");
  });

  it("renders blocking indicator", () => {
    render(<TaskCard task={makeTask({ blocking: true })} />);
    expect(screen.getByTestId("blocking-badge")).toHaveTextContent("Blocking");
  });

  it("does not render blocking badge when not blocking", () => {
    render(<TaskCard task={makeTask({ blocking: false })} />);
    expect(screen.queryByTestId("blocking-badge")).not.toBeInTheDocument();
  });

  it("renders project tag", () => {
    render(<TaskCard task={makeTask({ project: "Auth" })} />);
    expect(screen.getByText("Auth")).toBeInTheDocument();
  });

  it("renders link when present", () => {
    render(<TaskCard task={makeTask({ link: "https://example.com" })} />);
    expect(screen.getByText("Link")).toHaveAttribute("href", "https://example.com");
  });

  it("calls onEdit when edit button clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const task = makeTask();
    render(<TaskCard task={task} onEdit={onEdit} />);
    await user.click(screen.getByLabelText("Edit Test Task"));
    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it("calls onDelete when delete button clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TaskCard task={makeTask()} onDelete={onDelete} />);
    await user.click(screen.getByLabelText("Delete Test Task"));
    expect(onDelete).toHaveBeenCalledWith("test-1");
  });
});
