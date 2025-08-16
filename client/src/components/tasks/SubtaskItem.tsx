import React from 'react';
import { useFieldArray, useFormContext, Control, UseFormRegister } from 'react-hook-form';
import { InsertTask } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, CornerDownRight } from 'lucide-react';
import { nanoid } from 'nanoid';

interface SubtaskItemProps {
  nestingLevel: number;
  path: string;
  remove: (index: number) => void;
  index: number;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  nestingLevel,
  path,
  remove,
  index,
}) => {
  const { control, register } = useFormContext<InsertTask>();
  const { fields, append, remove: removeChild } = useFieldArray({
    control,
    name: `${path}.subtasks`,
  });

  const addSubtask = () => {
    append({
      id: nanoid(),
      title: '',
      completed: false,
      subtasks: [],
    });
  };

  return (
    <div style={{ marginLeft: `${nestingLevel * 25}px` }} className="space-y-3">
      <div className="flex items-center gap-2">
        <CornerDownRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Input
          {...register(`${path}.title`)}
          placeholder={`New subtask...`}
          className="flex-grow"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Add nested subtask"
          onClick={addSubtask}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Remove subtask"
          onClick={() => remove(index)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {fields.map((item, childIndex) => (
        <SubtaskItem
          key={item.id}
          nestingLevel={nestingLevel + 1}
          path={`${path}.subtasks.${childIndex}`}
          remove={() => removeChild(childIndex)}
          index={childIndex}
        />
      ))}
    </div>
  );
};
