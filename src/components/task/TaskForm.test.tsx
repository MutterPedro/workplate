import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "./TaskForm";

const asyncNoop = vi.fn().mockResolvedValue(undefined);

describe("TaskForm", () => {
  it("renders the form with add button", () => {
    render(<TaskForm onSubmit={asyncNoop} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Task title")).toBeInTheDocument();
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  it("renders Save button when editing", () => {
    render(
      <TaskForm
        onSubmit={asyncNoop}
        onCancel={vi.fn()}
        initialValues={{ id: "1", title: "Existing" } as any}
      />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("submits with title", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Task title"), "New task");
    await user.click(screen.getByText("Add Task"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New task" }),
      );
    });
  });

  it("does not submit with empty title", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.click(screen.getByText("Add Task"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={asyncNoop} onCancel={onCancel} />);
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows error on submit failure", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("DB error"));
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Task title"), "Fail task");
    await user.click(screen.getByText("Add Task"));
    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeInTheDocument();
    });
  });

  it("shows spinner while submitting", async () => {
    const user = userEvent.setup();
    let resolve: () => void;
    const onSubmit = vi.fn().mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Task title"), "Slow task");
    await user.click(screen.getByText("Add Task"));
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    resolve!();
  });
});
