import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Backlog } from "./Backlog";
import { RepositoryProvider } from "../services/repository-context";
import { MockTaskRepository } from "../services/task-repository.mock";

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

function renderBacklog(repo: MockTaskRepository) {
  return render(
    <MemoryRouter>
      <RepositoryProvider repository={repo}>
        <Backlog />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("Backlog", () => {
  let repo: MockTaskRepository;

  beforeEach(() => {
    repo = new MockTaskRepository();
  });

  it("renders the heading", async () => {
    renderBacklog(repo);
    await waitFor(() => {
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });
  });

  it("shows empty message when no tasks", async () => {
    renderBacklog(repo);
    await waitFor(() => {
      expect(screen.getByText(/backlog is empty/i)).toBeInTheDocument();
    });
  });

  it("renders backlog tasks", async () => {
    await repo.create({ title: "Future work", status: "backlog" });
    renderBacklog(repo);
    await waitFor(() => {
      expect(screen.getByText("Future work")).toBeInTheDocument();
    });
  });

  it("does not show plate tasks", async () => {
    await repo.create({ title: "Plate item", status: "plate" });
    renderBacklog(repo);
    await waitFor(() => {
      expect(screen.queryByText("Plate item")).not.toBeInTheDocument();
    });
  });

  it("adds a task to backlog", async () => {
    const user = userEvent.setup();
    renderBacklog(repo);

    await waitFor(() => {
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Add task"));
    await user.type(screen.getByLabelText("Task title"), "Research new framework");
    await user.click(screen.getByText("Add Task"));

    await waitFor(() => {
      expect(screen.getByText("Research new framework")).toBeInTheDocument();
    });
  });
});
