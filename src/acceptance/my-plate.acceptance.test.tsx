/**
 * Acceptance tests for My Plate feature
 * Maps to tests/features/my-plate.feature Gherkin scenarios
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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

function renderMyPlate(repo: MockTaskRepository) {
  return render(
    <MemoryRouter>
      <RepositoryProvider repository={repo}>
        <MyPlate />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

describe("Feature: My Plate", () => {
  let repo: MockTaskRepository;

  beforeEach(() => {
    repo = new MockTaskRepository();
  });

  describe("Scenario: View empty plate", () => {
    it('Given I have no tasks, When I view My Plate, Then I should see "Your plate is empty"', async () => {
      renderMyPlate(repo);
      await waitFor(() => {
        expect(screen.getByText(/plate is empty/i)).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Add a task to My Plate", () => {
    it("Given no tasks, When I add a task, Then it appears in the list", async () => {
      const user = userEvent.setup();
      renderMyPlate(repo);

      await waitFor(() => expect(screen.getByText("My Plate")).toBeInTheDocument());

      // When I click "Add task"
      await user.click(screen.getByLabelText("Add task"));

      // And I enter "Fix auth bug" as the task title
      await user.type(screen.getByLabelText("Task title"), "Fix auth bug");

      // And I submit the form
      await user.click(screen.getByText("Add Task"));

      // Then I should see "Fix auth bug" in the task list
      await waitFor(() => {
        expect(screen.getByText("Fix auth bug")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: View existing tasks", () => {
    it("Given tasks on my plate, When I view My Plate, Then I see all of them", async () => {
      // Given
      await repo.create({ title: "Fix auth bug", priority: "P0", size: "M", status: "plate" });
      await repo.create({ title: "Update docs", priority: "P2", size: "S", status: "plate" });

      // When
      renderMyPlate(repo);

      // Then
      await waitFor(() => {
        expect(screen.getByText("Fix auth bug")).toBeInTheDocument();
        expect(screen.getByText("Update docs")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Delete a task", () => {
    it("Given a task on my plate, When I delete it, Then it disappears", async () => {
      const user = userEvent.setup();

      // Given
      await repo.create({ title: "Remove me", priority: "P3", size: "S", status: "plate" });

      // When
      renderMyPlate(repo);
      await waitFor(() => expect(screen.getByText("Remove me")).toBeInTheDocument());
      await user.click(screen.getByLabelText("Delete Remove me"));

      // Then
      await waitFor(() => {
        expect(screen.queryByText("Remove me")).not.toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Backlog tasks don't appear on plate", () => {
    it("Given backlog tasks, When I view My Plate, Then they are not shown", async () => {
      await repo.create({ title: "Future work", status: "backlog" });
      renderMyPlate(repo);
      await waitFor(() => {
        expect(screen.getByText(/plate is empty/i)).toBeInTheDocument();
      });
      expect(screen.queryByText("Future work")).not.toBeInTheDocument();
    });
  });
});
