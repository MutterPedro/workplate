import { useState, useEffect, useCallback } from "react";
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "../types/task";
import { useRepository } from "../services/repository-context";

interface UseTasksOptions {
  status?: TaskStatus;
}

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus, sortOrder: number) => Promise<void>;
  reorderTask: (id: string, newSortOrder: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksResult {
  const repo = useRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await repo.list(options.status);
      setTasks(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [repo, options.status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      const task = await repo.create({ ...input, status: input.status ?? options.status ?? "plate" });
      await fetchTasks();
      return task;
    },
    [repo, options.status, fetchTasks],
  );

  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput) => {
      await repo.update(id, input);
      await fetchTasks();
    },
    [repo, fetchTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await repo.delete(id);
      await fetchTasks();
    },
    [repo, fetchTasks],
  );

  const moveTask = useCallback(
    async (id: string, status: TaskStatus, sortOrder: number) => {
      await repo.moveToStatus(id, status, sortOrder);
      await fetchTasks();
    },
    [repo, fetchTasks],
  );

  const reorderTask = useCallback(
    async (id: string, newSortOrder: number) => {
      await repo.reorder(id, newSortOrder);
      await fetchTasks();
    },
    [repo, fetchTasks],
  );

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTask,
    refresh: fetchTasks,
  };
}
