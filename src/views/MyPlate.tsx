import { useCallback, useMemo } from "react";
import { useTasks } from "../hooks/use-tasks";
import { useAppStore } from "../store/app-store";
import { SortableTaskList } from "../components/task/SortableTaskList";
import { TaskForm } from "../components/task/TaskForm";
import { TaskFilters } from "../components/task/TaskFilters";
import type { Task, CreateTaskInput, UpdateTaskInput } from "../types/task";

export function MyPlate() {
  const { tasks, loading, addTask, updateTask, deleteTask, reorderTask } = useTasks({ status: "plate" });
  const { filters, showAddForm, setShowAddForm, editingTaskId, setEditingTaskId } = useAppStore();

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.size && t.size !== filters.size) return false;
      if (filters.project && !t.project.toLowerCase().includes(filters.project.toLowerCase())) return false;
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) && !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filters]);

  const handleAdd = useCallback(
    async (input: CreateTaskInput | UpdateTaskInput) => {
      await addTask(input as CreateTaskInput);
      setShowAddForm(false);
    },
    [addTask, setShowAddForm],
  );

  const handleEdit = useCallback(
    (task: Task) => {
      setEditingTaskId(task.id);
    },
    [setEditingTaskId],
  );

  const handleUpdate = useCallback(
    async (input: CreateTaskInput | UpdateTaskInput) => {
      if (editingTaskId) {
        await updateTask(editingTaskId, input as UpdateTaskInput);
        setEditingTaskId(null);
      }
    },
    [editingTaskId, updateTask, setEditingTaskId],
  );

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  if (loading) {
    return <div className="p-6 text-text-muted">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text">My Plate</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-sm text-white bg-plate hover:bg-blue-600 rounded-md"
          aria-label="Add task"
        >
          + Add Task
        </button>
      </div>

      <div className="mb-4">
        <TaskFilters />
      </div>

      {showAddForm && (
        <div className="mb-4">
          <TaskForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {editingTask && (
        <div className="mb-4">
          <TaskForm
            onSubmit={handleUpdate}
            onCancel={() => setEditingTaskId(null)}
            initialValues={editingTask}
          />
        </div>
      )}

      <SortableTaskList
        tasks={filteredTasks}
        onReorder={reorderTask}
        onEdit={handleEdit}
        onDelete={deleteTask}
        emptyMessage="Your plate is empty. Add a task to get started!"
        listId="plate"
      />
    </div>
  );
}
