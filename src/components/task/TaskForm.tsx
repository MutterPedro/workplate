import { useState } from "react";
import type { Priority, Size, CreateTaskInput, UpdateTaskInput } from "../../types/task";
import type { Task } from "../../types/task";

interface TaskFormProps {
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialValues?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        size,
        project: project.trim(),
        link: link.trim() || null,
        blocking,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-white p-4 shadow-sm" data-testid="task-form">
      <div className="flex flex-col gap-3">
        {error && (
          <div className="text-sm text-p0 bg-red-50 px-3 py-2 rounded-md">{error}</div>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-plate"
          autoFocus
          disabled={submitting}
          aria-label="Task title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-plate resize-none"
          rows={2}
          disabled={submitting}
          aria-label="Description"
        />
        <div className="flex gap-3 flex-wrap">
          <label className="flex items-center gap-1 text-sm">
            <span className="text-text-muted">Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="border border-border rounded px-2 py-1 text-sm"
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
              aria-label="Link"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={blocking}
              onChange={(e) => setBlocking(e.target.checked)}
              disabled={submitting}
            />
            <span className="text-text-muted">I'm blocking this</span>
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text border border-border rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="px-3 py-1.5 text-sm text-white bg-plate hover:bg-blue-600 rounded-md disabled:opacity-50 transition-all duration-150 active:scale-95"
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEditing ? "Save" : "Add Task"}
          </button>
        </div>
      </div>
    </form>
  );
}
