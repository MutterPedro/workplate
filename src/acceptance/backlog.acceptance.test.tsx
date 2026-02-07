/**
 * Acceptance tests for Backlog feature
 * Maps to tests/features/backlog.feature Gherkin scenarios
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Backlog } from "../views/Backlog";
import { MyPlate } from "../views/MyPlate";
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

function renderMyPlate(repo: MockTaskRepository) {
  return render(
    <MemoryRouter>
      <RepositoryProvider repository={repo}>
        <MyPlate />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("Feature: Backlog", () => {
  let repo: MockTaskRepository;

  beforeEach(() => {
    repo = new MockTaskRepository();
  });

  describe("Scenario: View empty backlog", () => {
    it('Given no tasks, When I view Backlog, Then I should see "Backlog is empty"', async () => {
      renderBacklog(repo);
      await waitFor(() => {
        expect(screen.getByText(/backlog is empty/i)).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Add a task to Backlog", () => {
    it("Given no tasks, When I add a task to Backlog, Then it appears", async () => {
      const user = userEvent.setup();
      renderBacklog(repo);

      await waitFor(() => expect(screen.getByText("Backlog")).toBeInTheDocument());

      await user.click(screen.getByLabelText("Add task"));
      await user.type(screen.getByLabelText("Task title"), "Research new framework");
      await user.click(screen.getByText("Add Task"));

      await waitFor(() => {
        expect(screen.getByText("Research new framework")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Backlog tasks don't appear on plate", () => {
    it("Given backlog tasks, When I view My Plate, Then they are not shown", async () => {
      await repo.create({ title: "Future work", priority: "P3", size: "L", status: "backlog" });
      renderMyPlate(repo);
      await waitFor(() => {
        expect(screen.queryByText("Future work")).not.toBeInTheDocument();
      });
    });
  });
});
