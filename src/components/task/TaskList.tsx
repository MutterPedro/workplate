import type { Task } from "../../types/task";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function TaskList({ tasks, onEdit, onDelete, emptyMessage = "No tasks" }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted" data-testid="empty-list">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="task-list" role="list">
      {tasks.map((task) => (
        <div key={task.id} role="listitem">
          <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
