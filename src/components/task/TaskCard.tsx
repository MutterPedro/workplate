import { clsx } from "clsx";
import type { Task } from "../../types/task";

const priorityColors: Record<string, string> = {
  P0: "bg-p0 text-white",
  P1: "bg-p1 text-white",
  P2: "bg-p2 text-black",
  P3: "bg-p3 text-white",
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

export function TaskCard({ task, onEdit, onDelete, dragHandleProps }: TaskCardProps) {
  return (
    <div
      data-testid={`task-card-${task.id}`}
      className={clsx(
        "rounded-lg border border-border bg-white p-3 shadow-sm",
        "hover:shadow-md transition-shadow",
        task.blocking && "border-l-4 border-l-p0",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {dragHandleProps && (
              <span {...dragHandleProps} className="cursor-grab text-text-muted" aria-label="Drag handle">
                ⠿
              </span>
            )}
            <h3 className="font-medium text-text truncate">{task.title}</h3>
          </div>
          {task.description && (
            <p className="text-sm text-text-muted mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={clsx("text-xs font-semibold px-1.5 py-0.5 rounded", priorityColors[task.priority])}
              data-testid="priority-badge"
            >
              {task.priority}
            </span>
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-text-muted"
              data-testid="size-badge"
            >
              {task.size}
            </span>
            {task.blocking && (
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-50 text-p0"
                data-testid="blocking-badge"
              >
                Blocking
              </span>
            )}
            {task.project && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-plate">
                {task.project}
              </span>
            )}
            {task.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-plate hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Link
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-text-muted hover:text-text p-1 text-sm"
              aria-label={`Edit ${task.title}`}
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-text-muted hover:text-p0 p-1 text-sm"
              aria-label={`Delete ${task.title}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
