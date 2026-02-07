import { useState } from "react";
import type { Priority, Size, CreateTaskInput, UpdateTaskInput } from "../../types/task";
import type { Task } from "../../types/task";

interface TaskFormProps {
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => void;
  onCancel: () => void;
  initialValues?: Partial<Task>;
}

export function TaskForm({ onSubmit, onCancel, initialValues }: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initialValues?.priority ?? "P2");
  const [size, setSize] = useState<Size>(initialValues?.size ?? "M");
  const [project, setProject] = useState(initialValues?.project ?? "");
  const [link, setLink] = useState(initialValues?.link ?? "");
  const [blocking, setBlocking] = useState(initialValues?.blocking ?? false);

  const isEditing = !!initialValues?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      size,
      project: project.trim(),
      link: link.trim() || null,
      blocking,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-white p-4 shadow-sm" data-testid="task-form">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-plate"
          autoFocus
          aria-label="Task title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-plate resize-none"
          rows={2}
          aria-label="Description"
        />
        <div className="flex gap-3 flex-wrap">
          <label className="flex items-center gap-1 text-sm">
            <span className="text-text-muted">Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="border border-border rounded px-2 py-1 text-sm"
              aria-label="Priority"
            >
              <option value="P0">P0 - Critical</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-sm">
            <span className="text-text-muted">Size:</span>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as Size)}
              className="border border-border rounded px-2 py-1 text-sm"
              aria-label="Size"
            >
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-sm">
            <span className="text-text-muted">Project:</span>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Auth"
              className="border border-border rounded px-2 py-1 text-sm w-24"
              aria-label="Project"
            />
          </label>
        </div>
        <div className="flex gap-3 flex-wrap">
          <label className="flex items-center gap-1 text-sm">
            <span className="text-text-muted">Link:</span>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="border border-border rounded px-2 py-1 text-sm w-48"
              aria-label="Link"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={blocking}
              onChange={(e) => setBlocking(e.target.checked)}
            />
            <span className="text-text-muted">I'm blocking this</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text border border-border rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-3 py-1.5 text-sm text-white bg-plate hover:bg-blue-600 rounded-md disabled:opacity-50"
          >
            {isEditing ? "Save" : "Add Task"}
          </button>
        </div>
      </div>
    </form>
  );
}
