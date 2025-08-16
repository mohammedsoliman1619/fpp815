import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/lib/store';
import { insertHabitLoopSchema, type InsertHabitLoop, type HabitLoop, type HabitLoopStep } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash, ArrowUp, ArrowDown, Task, Reminder } from 'lucide-react';

interface HabitLoopFormProps {
  loop?: HabitLoop;
  onSubmit: (data: InsertHabitLoop) => void;
  onCancel: () => void;
}

export function HabitLoopForm({ loop, onSubmit, onCancel }: HabitLoopFormProps) {
  const { t } = useTranslation();
  const { tasks, reminders } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const form = useForm<InsertHabitLoop>({
    resolver: zodResolver(insertHabitLoopSchema),
    defaultValues: loop || {
      name: '',
      steps: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const handleSubmit = (data: InsertHabitLoop) => {
    onSubmit(data);
  };

  const addItemAsStep = (item: Task | Reminder, type: 'task' | 'reminder') => {
    append({
      id: nanoid(),
      itemId: item.id,
      itemType: type,
      order: fields.length,
    });
    setIsSearchOpen(false);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-4 border rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="loop-name">Loop Name</Label>
        <Input
          id="loop-name"
          {...form.register('name')}
          placeholder="e.g., Morning Routine"
        />
      </div>

      <div className="space-y-2">
        <Label>Steps</Label>
        <div className="space-y-2">
          {fields.map((field, index) => {
            const item = field.itemType === 'task'
              ? tasks.find(t => t.id === field.itemId)
              : reminders.find(r => r.id === field.itemId);

            return (
              <div key={field.id} className="flex items-center gap-2 p-2 border rounded">
                <span className="flex-grow">{item?.title || 'Item not found'}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => move(index, index - 1)} disabled={index === 0}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Add Step
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search tasks or reminders..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Tasks">
                {tasks.map(task => (
                  <CommandItem key={`task-${task.id}`} onSelect={() => addItemAsStep(task, 'task')}>
                    {task.title}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Reminders">
                {reminders.map(reminder => (
                  <CommandItem key={`reminder-${reminder.id}`} onSelect={() => addItemAsStep(reminder, 'reminder')}>
                    {reminder.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Loop</Button>
      </div>
    </form>
  );
}
