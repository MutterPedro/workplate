export type Priority = "P0" | "P1" | "P2" | "P3";
export type Size = "S" | "M" | "L" | "XL";
export type TaskStatus = "plate" | "backlog" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  blocking: boolean;
  link: string | null;
  priority: Priority;
  project: string;
  size: Size;
  status: TaskStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  blocking?: boolean;
  link?: string | null;
  priority?: Priority;
  project?: string;
  size?: Size;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  blocking?: boolean;
  link?: string | null;
  priority?: Priority;
  project?: string;
  size?: Size;
  status?: TaskStatus;
  sortOrder?: number;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

export const SIZE_LABELS: Record<Size, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra Large",
};
