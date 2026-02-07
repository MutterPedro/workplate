import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "../types/task";

export interface TaskRepository {
  list(status?: TaskStatus): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  reorder(id: string, newSortOrder: number): Promise<void>;
  moveToStatus(id: string, status: TaskStatus, sortOrder: number): Promise<Task>;
}

interface DbRow {
  id: string;
  title: string;
  description: string;
  blocking: number;
  link: string | null;
  priority: string;
  project: string;
  size: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: DbRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    blocking: row.blocking !== 0,
    link: row.link,
    priority: row.priority as Task["priority"],
    project: row.project,
    size: row.size as Task["size"],
    status: row.status as Task["status"],
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TauriTaskRepository implements TaskRepository {
  private db: any = null;

  private async getDb() {
    if (!this.db) {
      const Database = (await import("@tauri-apps/plugin-sql")).default;
      this.db = await Database.load("sqlite:workplate.db");
    }
    return this.db;
  }

  async list(status?: TaskStatus): Promise<Task[]> {
    const db = await this.getDb();
    let rows: DbRow[];
    if (status) {
      rows = await db.select("SELECT * FROM tasks WHERE status = $1 ORDER BY sort_order ASC", [status]);
    } else {
      rows = await db.select("SELECT * FROM tasks ORDER BY sort_order ASC");
    }
    return rows.map(rowToTask);
  }

  async get(id: string): Promise<Task | null> {
    const db = await this.getDb();
    const rows: DbRow[] = await db.select("SELECT * FROM tasks WHERE id = $1", [id]);
    return rows.length > 0 ? rowToTask(rows[0]) : null;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const db = await this.getDb();
    const { v4: uuidv4 } = await import("uuid");
    const id = uuidv4();
    const now = new Date().toISOString();
    const status = input.status ?? "plate";
    const priority = input.priority ?? "P2";
    const size = input.size ?? "M";

    const maxRows = await db.select(
      "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM tasks WHERE status = $1",
      [status],
    );
    const sortOrder = (maxRows[0]?.max_order ?? -1) + 1;

    await db.execute(
      "INSERT INTO tasks (id, title, description, blocking, link, priority, project, size, status, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [
        id, input.title, input.description ?? "", input.blocking ? 1 : 0,
        input.link ?? null, priority, input.project ?? "", size,
        status, sortOrder, now, now,
      ],
    );

    return {
      id, title: input.title, description: input.description ?? "",
      blocking: input.blocking ?? false, link: input.link ?? null,
      priority, project: input.project ?? "", size, status,
      sortOrder, createdAt: now, updatedAt: now,
    } as Task;
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ["updated_at = $1"];
    const params: unknown[] = [now];
    let idx = 2;

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      const col = key === "sortOrder" ? "sort_order" : key === "createdAt" ? "created_at" : key === "updatedAt" ? "updated_at" : key;
      const dbVal = col === "blocking" ? (value ? 1 : 0) : value;
      sets.push(`${col} = $${idx}`);
      params.push(dbVal);
      idx++;
    }

    params.push(id);
    await db.execute(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $${idx}`, params);

    const rows: DbRow[] = await db.select("SELECT * FROM tasks WHERE id = $1", [id]);
    return rowToTask(rows[0]);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute("DELETE FROM tasks WHERE id = $1", [id]);
  }

  async reorder(id: string, newSortOrder: number): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute("UPDATE tasks SET sort_order = $1, updated_at = $2 WHERE id = $3", [newSortOrder, now, id]);
  }

  async moveToStatus(id: string, status: TaskStatus, sortOrder: number): Promise<Task> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE tasks SET status = $1, sort_order = $2, updated_at = $3 WHERE id = $4",
      [status, sortOrder, now, id],
    );
    const rows: DbRow[] = await db.select("SELECT * FROM tasks WHERE id = $1", [id]);
    return rowToTask(rows[0]);
  }
}
