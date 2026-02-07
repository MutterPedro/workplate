import { describe, it, expect, beforeEach } from "vitest";
import { MockTaskRepository } from "./task-repository.mock";

describe("MockTaskRepository", () => {
  let repo: MockTaskRepository;

  beforeEach(() => {
    repo = new MockTaskRepository();
  });

  it("creates a task with defaults", async () => {
    const task = await repo.create({ title: "Test task" });
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Test task");
    expect(task.status).toBe("plate");
    expect(task.priority).toBe("P2");
    expect(task.size).toBe("M");
    expect(task.blocking).toBe(false);
    expect(task.description).toBe("");
    expect(task.link).toBeNull();
  });

  it("creates a task with custom values", async () => {
    const task = await repo.create({
      title: "Urgent task",
      priority: "P0",
      size: "XL",
      blocking: true,
      status: "backlog",
      project: "Auth",
      link: "https://example.com",
      description: "Fix the auth flow",
    });
    expect(task.priority).toBe("P0");
    expect(task.size).toBe("XL");
    expect(task.blocking).toBe(true);
    expect(task.status).toBe("backlog");
    expect(task.project).toBe("Auth");
    expect(task.link).toBe("https://example.com");
  });

  it("lists all tasks", async () => {
    await repo.create({ title: "Task 1" });
    await repo.create({ title: "Task 2" });
    const tasks = await repo.list();
    expect(tasks).toHaveLength(2);
  });

  it("lists tasks filtered by status", async () => {
    await repo.create({ title: "Plate task", status: "plate" });
    await repo.create({ title: "Backlog task", status: "backlog" });
    const plate = await repo.list("plate");
    expect(plate).toHaveLength(1);
    expect(plate[0].title).toBe("Plate task");
  });

  it("gets a task by id", async () => {
    const created = await repo.create({ title: "Find me" });
    const found = await repo.get(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe("Find me");
  });

  it("returns null for missing task", async () => {
    const found = await repo.get("nonexistent");
    expect(found).toBeNull();
  });

  it("updates a task", async () => {
    const task = await repo.create({ title: "Original" });
    const updated = await repo.update(task.id, { title: "Updated", priority: "P0" });
    expect(updated.title).toBe("Updated");
    expect(updated.priority).toBe("P0");
    expect(updated.size).toBe("M"); // unchanged
  });

  it("deletes a task", async () => {
    const task = await repo.create({ title: "Delete me" });
    await repo.delete(task.id);
    const found = await repo.get(task.id);
    expect(found).toBeNull();
  });

  it("assigns incrementing sort orders", async () => {
    const t1 = await repo.create({ title: "First" });
    const t2 = await repo.create({ title: "Second" });
    expect(t1.sortOrder).toBe(0);
    expect(t2.sortOrder).toBe(1);
  });

  it("moves task to a different status", async () => {
    const task = await repo.create({ title: "Move me", status: "plate" });
    const moved = await repo.moveToStatus(task.id, "backlog", 0);
    expect(moved.status).toBe("backlog");
    expect(moved.sortOrder).toBe(0);
  });
});
