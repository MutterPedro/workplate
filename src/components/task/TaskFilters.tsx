import type { Priority, Size } from "../../types/task";
import { useAppStore } from "../../store/app-store";

export function TaskFilters() {
  const { filters, setFilter, clearFilters } = useAppStore();
  const hasActiveFilters = filters.priority || filters.project || filters.size || filters.search;

  return (
    <div className="flex items-center gap-3 flex-wrap" data-testid="task-filters">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilter("search", e.target.value)}
        placeholder="Search tasks..."
        className="border border-border rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-plate"
        aria-label="Search tasks"
      />
      <select
        value={filters.priority ?? ""}
        onChange={(e) => setFilter("priority", (e.target.value || null) as Priority | null)}
        className="border border-border rounded-md px-2 py-1.5 text-sm"
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        <option value="P0">P0 - Critical</option>
        <option value="P1">P1 - High</option>
        <option value="P2">P2 - Medium</option>
        <option value="P3">P3 - Low</option>
      </select>
      <select
        value={filters.size ?? ""}
        onChange={(e) => setFilter("size", (e.target.value || null) as Size | null)}
        className="border border-border rounded-md px-2 py-1.5 text-sm"
        aria-label="Filter by size"
      >
        <option value="">All sizes</option>
        <option value="S">Small</option>
        <option value="M">Medium</option>
        <option value="L">Large</option>
        <option value="XL">Extra Large</option>
      </select>
      <input
        type="text"
        value={filters.project ?? ""}
        onChange={(e) => setFilter("project", e.target.value || null)}
        placeholder="Project..."
        className="border border-border rounded-md px-2 py-1.5 text-sm w-24"
        aria-label="Filter by project"
      />
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-text-muted hover:text-text underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
