import React from 'react';
import { Subtask } from '@shared/schema';
import { useAppStore } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SubtaskListItemProps {
  taskId: string;
  subtask: Subtask;
  nestingLevel: number;
}

export const SubtaskListItem: React.FC<SubtaskListItemProps> = ({
  taskId,
  subtask,
  nestingLevel,
}) => {
  const { toggleSubtaskCompletion } = useAppStore();

  const handleToggle = () => {
    // This is a simplified handler. A real implementation would need to
    // traverse the task's subtask tree to find and update the correct one.
    // For now, we'll assume a store function that can handle this logic.
    // toggleSubtaskCompletion(taskId, subtask.id);
    console.log("Toggling subtask", taskId, subtask.id);
  };

  return (
    <div style={{ marginLeft: `${nestingLevel * 25}px` }} className="space-y-2">
      <div className="flex items-center gap-2 group">
        <Checkbox
          id={`subtask-${subtask.id}`}
          checked={subtask.completed}
          onCheckedChange={handleToggle}
        />
        <label
          htmlFor={`subtask-${subtask.id}`}
          className={`flex-grow text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
        >
          {subtask.title}
        </label>
      </div>

      {subtask.subtasks && subtask.subtasks.length > 0 && (
        <div className="mt-2 space-y-2">
          {subtask.subtasks.map((childSubtask) => (
            <SubtaskListItem
              key={childSubtask.id}
              taskId={taskId}
              subtask={childSubtask}
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
