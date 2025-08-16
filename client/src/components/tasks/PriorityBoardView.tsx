import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Task } from '@shared/schema';
import { TaskItem } from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';

const priorityLevels = ['P1', 'P2', 'P3', 'P4'] as const;
type PriorityLevel = typeof priorityLevels[number];

const priorityConfig = {
  P1: { label: 'High', color: 'bg-red-500' },
  P2: { label: 'Medium', color: 'bg-yellow-500' },
  P3: { label: 'Normal', color: 'bg-blue-500' },
  P4: { label: 'Low', color: 'bg-gray-500' },
};

function DraggableTaskItem({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskItem task={task} onEdit={() => {}} />
    </div>
  );
}

function PriorityColumn({ priority, tasks }: { priority: PriorityLevel; tasks: Task[] }) {
  const config = priorityConfig[priority];
  const { setNodeRef } = useDroppable({
    id: priority,
  });

  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${config.color}`}></span>
            {config.label} Priority
          </CardTitle>
          <span className="text-xs text-muted-foreground">{tasks.length} cards</span>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[500px] bg-muted/50 rounded-lg p-4">
          {tasks.map(task => (
            <DraggableTaskItem key={task.id} task={task} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function PriorityBoardView() {
  const { tasks, updateTask } = useAppStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const columns = useMemo(() => {
    const groupedTasks = {} as Record<PriorityLevel, Task[]>;
    for (const level of priorityLevels) {
      groupedTasks[level] = [];
    }
    tasks.forEach(task => {
      const priority = priorityLevels.includes(task.priority as any) ? task.priority : 'P4';
      groupedTasks[priority as PriorityLevel].push(task);
    });
    return groupedTasks;
  }, [tasks]);

  const handleDragStart = (event: any) => {
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      const newPriority = over.id as PriorityLevel;
      const taskId = active.id as string;
      const currentTask = tasks.find(t => t.id === taskId);

      if (currentTask && currentTask.priority !== newPriority) {
        updateTask(taskId, { priority: newPriority });
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex gap-6 overflow-x-auto p-4">
        {priorityLevels.map(priority => (
          <PriorityColumn key={priority} priority={priority} tasks={columns[priority]} />
        ))}
      </div>
      {createPortal(
        <DragOverlay>
          {activeTask ? <TaskItem task={activeTask} onEdit={() => {}} /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
