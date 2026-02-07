import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskList } from "./TaskList";
import type { Task } from "../../types/task";

const makeTask = (id: string, title: string): Task => ({
  id,
  title,
  description: "",
  blocking: false,
  link: null,
  priority: "P2",
  project: "",
  size: "M",
  status: "plate",
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

describe("TaskList", () => {
  it("renders a list of tasks", () => {
    const tasks = [makeTask("1", "Task A"), makeTask("2", "Task B")];
    render(<TaskList tasks={tasks} />);
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
  });

  it("renders empty message when no tasks", () => {
    render(<TaskList tasks={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders default empty message", () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText("No tasks")).toBeInTheDocument();
  });
});
