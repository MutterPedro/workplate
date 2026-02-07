import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MyPlate } from "./MyPlate";
import { RepositoryProvider } from "../services/repository-context";
import { MockTaskRepository } from "../services/task-repository.mock";

// Mock dnd-kit to avoid drag-related issues in tests
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

function renderMyPlate(repo: MockTaskRepository) {
  return render(
    <MemoryRouter>
      <RepositoryProvider repository={repo}>
        <MyPlate />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("MyPlate", () => {
  let repo: MockTaskRepository;

  beforeEach(() => {
    repo = new MockTaskRepository();
  });

  it("renders the heading", async () => {
    renderMyPlate(repo);
    await waitFor(() => {
      expect(screen.getByText("My Plate")).toBeInTheDocument();
    });
  });

  it("shows empty message when no tasks", async () => {
    renderMyPlate(repo);
    await waitFor(() => {
      expect(screen.getByText(/plate is empty/i)).toBeInTheDocument();
    });
  });

  it("renders tasks from repository", async () => {
    await repo.create({ title: "Fix auth bug", status: "plate" });
    renderMyPlate(repo);
    await waitFor(() => {
      expect(screen.getByText("Fix auth bug")).toBeInTheDocument();
    });
  });

  it("does not show backlog tasks", async () => {
    await repo.create({ title: "Backlog item", status: "backlog" });
    renderMyPlate(repo);
    await waitFor(() => {
      expect(screen.queryByText("Backlog item")).not.toBeInTheDocument();
    });
  });

  it("opens add form and creates a task", async () => {
    const user = userEvent.setup();
    renderMyPlate(repo);

    await waitFor(() => {
      expect(screen.getByText("My Plate")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Add task"));
    await user.type(screen.getByLabelText("Task title"), "New task");
    await user.click(screen.getByText("Add Task"));

    await waitFor(() => {
      expect(screen.getByText("New task")).toBeInTheDocument();
    });
  });
});
