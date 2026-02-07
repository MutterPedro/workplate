import { v4 as uuidv4 } from "uuid";
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "../types/task";
import type { TaskRepository } from "./task-repository";

export class MockTaskRepository implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  async list(status?: TaskStatus): Promise<Task[]> {
    const all = Array.from(this.tasks.values());
    const filtered = status ? all.filter((t) => t.status === status) : all;
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async get(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const status = input.status ?? "plate";
    const existing = Array.from(this.tasks.values()).filter((t) => t.status === status);
    const maxOrder = existing.reduce((max, t) => Math.max(max, t.sortOrder), -1);

    const task: Task = {
      id: uuidv4(),
      title: input.title,
      description: input.description ?? "",
      blocking: input.blocking ?? false,
      link: input.link ?? null,
      priority: input.priority ?? "P2",
      project: input.project ?? "",
      size: input.size ?? "M",
      status,
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    const updated: Task = {
      ...task,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async reorder(id: string, newSortOrder: number): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    const sameBucket = Array.from(this.tasks.values())
      .filter((t) => t.status === task.status && t.id !== id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    sameBucket.splice(newSortOrder, 0, { ...task, sortOrder: newSortOrder });

    sameBucket.forEach((t, i) => {
      const existing = this.tasks.get(t.id)!;
      this.tasks.set(t.id, { ...existing, sortOrder: i });
    });
  }

  async moveToStatus(id: string, status: TaskStatus, sortOrder: number): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    const updated: Task = {
      ...task,
      status,
      sortOrder,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async seed(): Promise<void> {
    // No-op for mock — tests set up their own data
  }

  clear(): void {
    this.tasks.clear();
  }
}
