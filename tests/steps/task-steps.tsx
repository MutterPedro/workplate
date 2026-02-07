import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import type { WorkPlateWorld } from "../support/world";
import { RepositoryProvider } from "../../src/services/repository-context";
import { MyPlate } from "../../src/views/MyPlate";
import { Backlog } from "../../src/views/Backlog";
import type { Priority, Size, CreateTaskInput } from "../../src/types/task";

// Mock dnd-kit
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: () => [],
}));
jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}));
jest.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
}));

function renderView(world: WorkPlateWorld, view: "plate" | "backlog") {
  const Component = view === "plate" ? MyPlate : Backlog;
  render(
    <MemoryRouter>
      <RepositoryProvider repository={world.repository}>
        <Component />
      </RepositoryProvider>
    </MemoryRouter>,
  );
}

Given("I have no tasks", function (this: WorkPlateWorld) {
  this.repository.clear();
});

Given(
  "I have the following tasks on my plate:",
  async function (this: WorkPlateWorld, dataTable: DataTable) {
    for (const row of dataTable.hashes()) {
      await this.repository.create({
        title: row.title,
        priority: (row.priority as Priority) ?? "P2",
        size: (row.size as Size) ?? "M",
        status: "plate",
      });
    }
  },
);

Given(
  "I have the following tasks in the backlog:",
  async function (this: WorkPlateWorld, dataTable: DataTable) {
    for (const row of dataTable.hashes()) {
      await this.repository.create({
        title: row.title,
        priority: (row.priority as Priority) ?? "P2",
        size: (row.size as Size) ?? "M",
        status: "backlog",
      });
    }
  },
);

When("I view My Plate", function (this: WorkPlateWorld) {
  renderView(this, "plate");
});

When("I view Backlog", function (this: WorkPlateWorld) {
  renderView(this, "backlog");
});

When("I click {string}", async function (this: WorkPlateWorld, label: string) {
  const user = userEvent.setup();
  await waitFor(async () => {
    const button = screen.getByLabelText(label) ?? screen.getByText(label);
    await user.click(button);
  });
});

When(
  "I enter {string} as the task title",
  async function (this: WorkPlateWorld, title: string) {
    const user = userEvent.setup();
    const input = screen.getByLabelText("Task title");
    await user.type(input, title);
  },
);

When("I submit the form", async function () {
  const user = userEvent.setup();
  const submitButton =
    screen.queryByText("Add Task") ?? screen.getByText("Save");
  await user.click(submitButton!);
});

When(
  "I delete the task {string}",
  async function (this: WorkPlateWorld, title: string) {
    const user = userEvent.setup();
    await waitFor(async () => {
      const button = screen.getByLabelText(`Delete ${title}`);
      await user.click(button);
    });
  },
);

Then(
  "I should see {string}",
  async function (this: WorkPlateWorld, text: string) {
    await waitFor(() => {
      expect(screen.getByText(text, { exact: false })).toBeTruthy();
    });
  },
);

Then(
  "I should see {string} in the task list",
  async function (this: WorkPlateWorld, title: string) {
    await waitFor(() => {
      expect(screen.getByText(title)).toBeTruthy();
    });
  },
);

Then(
  "I should not see {string} in the task list",
  async function (this: WorkPlateWorld, title: string) {
    await waitFor(() => {
      expect(screen.queryByText(title)).toBeNull();
    });
  },
);
