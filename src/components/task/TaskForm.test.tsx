import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "./TaskForm";

describe("TaskForm", () => {
  it("renders the form with add button", () => {
    render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Task title")).toBeInTheDocument();
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  it("renders Save button when editing", () => {
    render(
      <TaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialValues={{ id: "1", title: "Existing" } as any}
      />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("submits with title", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Task title"), "New task");
    await user.click(screen.getByText("Add Task"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New task" }),
    );
  });

  it("does not submit with empty title", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.click(screen.getByText("Add Task"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
