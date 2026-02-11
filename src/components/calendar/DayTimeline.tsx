import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TimeBlock } from "../../types/calendar";
import { computeBlockHeight, eventColor } from "../../services/calendar-service";

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  meeting: { label: "Meeting", className: "bg-blue-100 text-blue-700" },
  focus: { label: "Focus", className: "bg-green-100 text-green-700" },
  other: { label: "Event", className: "bg-gray-100 text-gray-600" },
};

function EventBlock({ block }: { block: TimeBlock }) {
  const event = block.event!;
  const badge = TYPE_BADGE[event.type];
  const borderColor = event.color ?? eventColor(undefined, event.summary);

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-white p-3"
      style={{ borderLeftWidth: "4px", borderLeftColor: borderColor }}
    >
      <div className="text-xs text-text-muted whitespace-nowrap pt-0.5">
        <div>{formatTime(block.start)}</div>
        <div>{formatTime(block.end)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text truncate">{event.summary}</div>
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${badge.className}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
}

function FreeBlock({ block }: { block: TimeBlock }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-green-300 bg-green-50 p-3">
      <div className="text-xs text-text-muted whitespace-nowrap">
        <div>{formatTime(block.start)}</div>
        <div>{formatTime(block.end)}</div>
      </div>
      <div className="text-sm text-green-700 font-medium">Free</div>
    </div>
  );
}

function PomodoroBlock({ block, plateTasks, onTaskAssign, pomodoroIndex }: { block: TimeBlock; plateTasks?: string[]; onTaskAssign?: (pomodoroIndex: number, taskTitle: string) => void; pomodoroIndex: number }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredTasks = (plateTasks ?? []).filter((t) =>
    t.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
      <div className="text-xs text-text-muted whitespace-nowrap">
        <div>{formatTime(block.start)}</div>
        <div>{formatTime(block.end)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-amber-700 font-medium">Pomodoro</div>
        {block.assignedTask ? (
          <div className="text-sm text-text mt-1">{block.assignedTask}</div>
        ) : showSearch ? (
          <div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="mt-1 w-full text-sm border border-border rounded px-2 py-1"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {filteredTasks.length > 0 && (
              <div className="mt-1">
                {filteredTasks.map((task) => (
                  <div
                    key={task}
                    className="cursor-pointer text-sm px-2 py-1 hover:bg-amber-100"
                    onClick={() => onTaskAssign?.(pomodoroIndex, task)}
                  >
                    {task}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="mt-1 text-xs text-amber-600 hover:text-amber-800"
          >
            Assign task
          </button>
        )}
      </div>
    </div>
  );
}

function SortablePomodoroBlock({ block, id, plateTasks, onTaskAssign, pomodoroIndex }: { block: TimeBlock; id: string; plateTasks?: string[]; onTaskAssign?: (pomodoroIndex: number, taskTitle: string) => void; pomodoroIndex: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {block.assignedTask && (
        <div data-testid="drag-handle" className="cursor-grab px-1 text-gray-400" {...listeners}>
          &#x2630;
        </div>
      )}
      <PomodoroBlock block={block} plateTasks={plateTasks} onTaskAssign={onTaskAssign} pomodoroIndex={pomodoroIndex} />
    </div>
  );
}

function LunchBlock({ block }: { block: TimeBlock }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3">
      <div className="text-xs text-text-muted whitespace-nowrap">
        <div>{formatTime(block.start)}</div>
        <div>{formatTime(block.end)}</div>
      </div>
      <div className="text-sm text-orange-700 font-medium">Lunch</div>
    </div>
  );
}

function RestBlock({ block }: { block: TimeBlock }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <div className="text-xs text-text-muted whitespace-nowrap">
        <div>{formatTime(block.start)}</div>
        <div>{formatTime(block.end)}</div>
      </div>
      <div className="text-sm text-gray-600 font-medium">Rest</div>
    </div>
  );
}

interface DayTimelineProps {
  blocks: TimeBlock[];
  onLunchMove?: (newLunchStart: string) => void;
  onTaskReorder?: (fromPomodoroIndex: number, toPomodoroIndex: number) => void;
  plateTasks?: string[];
  onTaskAssign?: (pomodoroIndex: number, taskTitle: string) => void;
}

export function DayTimeline({ blocks, onLunchMove, onTaskReorder, plateTasks, onTaskAssign }: DayTimelineProps) {
  if (blocks.length === 0) {
    return (
      <div className="text-center text-text-muted py-8">
        No events today
      </div>
    );
  }

  const sortableIds = blocks.map((block, i) => {
    if (block.kind === "lunch") return "lunch";
    if (block.kind === "pomodoro" && block.assignedTask) return `pomodoro-${i}`;
    return `block-${i}`;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (active.id === "lunch" && onLunchMove) {
      // Determine new lunch time based on drop target
      const overIndex = sortableIds.indexOf(String(over.id));
      if (overIndex >= 0 && blocks[overIndex]) {
        const targetBlock = blocks[overIndex];
        const time = targetBlock.start.substring(11, 16);
        onLunchMove(time);
      }
      return;
    }

    // Handle pomodoro task reorder
    if (String(active.id).startsWith("pomodoro-") && String(over.id).startsWith("pomodoro-") && onTaskReorder) {
      const pomodoroBlocks = blocks.filter((b) => b.kind === "pomodoro");
      const activeBlockIndex = parseInt(String(active.id).replace("pomodoro-", ""));
      const overBlockIndex = parseInt(String(over.id).replace("pomodoro-", ""));
      const activeBlock = blocks[activeBlockIndex];
      const overBlock = blocks[overBlockIndex];
      const fromPomIndex = pomodoroBlocks.indexOf(activeBlock);
      const toPomIndex = pomodoroBlocks.indexOf(overBlock);
      if (fromPomIndex >= 0 && toPomIndex >= 0) {
        onTaskReorder(fromPomIndex, toPomIndex);
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {blocks.map((block, i) => {
            const height = computeBlockHeight(block.start, block.end);

            const wrapperStyle: React.CSSProperties = {
              minHeight: `${height}px`,
            };

            const pomodoroIndex = block.kind === "pomodoro"
              ? blocks.slice(0, i).filter((b) => b.kind === "pomodoro").length
              : 0;

            return (
              <div key={block.kind === "lunch" ? "lunch" : block.event?.id ?? `${block.kind}-${i}`} data-testid="time-block" style={wrapperStyle}>
                {block.kind === "event" && <EventBlock block={block} />}
                {block.kind === "pomodoro" && block.assignedTask && <SortablePomodoroBlock block={block} id={sortableIds[i]} plateTasks={plateTasks} onTaskAssign={onTaskAssign} pomodoroIndex={pomodoroIndex} />}
                {block.kind === "pomodoro" && !block.assignedTask && <PomodoroBlock block={block} plateTasks={plateTasks} onTaskAssign={onTaskAssign} pomodoroIndex={pomodoroIndex} />}
                {block.kind === "rest" && <RestBlock block={block} />}
                {block.kind === "lunch" && <LunchBlock block={block} />}
                {block.kind === "free" && <FreeBlock block={block} />}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
