import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '@/lib/store';
import { Task } from '@shared/schema';
import { TaskItem } from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const taskStatuses = ['backlog', 'todo', 'in-progress', 'done'] as const;

type TaskStatus = typeof taskStatuses[number];

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const KanbanColumn = ({ status, tasks }: KanbanColumnProps) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: status });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-80 flex-shrink-0">
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{t(`tasks.status.${status}`)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[500px] bg-muted/50 rounded-lg p-4">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} onEdit={() => {}} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export function KanbanView() {
  const { tasks, updateTask } = useAppStore();
  const { t } = useTranslation();

  const columns = useMemo(() => {
    const groupedTasks = {} as Record<TaskStatus, Task[]>;
    for (const status of taskStatuses) {
      groupedTasks[status] = [];
    }
    tasks.forEach(task => {
      if (task.status in groupedTasks) {
        groupedTasks[task.status as TaskStatus].push(task);
      }
    });
    return groupedTasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const task = tasks.find(t => t.id === active.id);
      const newStatus = over.id as TaskStatus;

      if (task && newStatus) {
        updateTask(task.id, { status: newStatus });
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto p-4">
        <SortableContext items={taskStatuses} strategy={horizontalListSortingStrategy}>
          {taskStatuses.map(status => (
            <KanbanColumn key={status} status={status} tasks={columns[status]} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
