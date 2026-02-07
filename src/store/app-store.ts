import { create } from "zustand";
import type { Priority, Size } from "../types/task";

interface Filters {
  priority: Priority | null;
  project: string | null;
  size: Size | null;
  search: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
}

const defaultFilters: Filters = {
  priority: null,
  project: null,
  size: null,
  search: "",
};

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
  editingTaskId: null,
  setEditingTaskId: (id) => set({ editingTaskId: id }),
  showAddForm: false,
  setShowAddForm: (show) => set({ showAddForm: show }),
}));
