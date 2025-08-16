import { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { insertTaskSchema, InsertTask, Subtask, RecurrencePattern } from '@shared/schema';
import { useAppStore } from '@/lib/store';
import { dbUtils } from '@/lib/db';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { 
  CalendarIcon, 
  PlusIcon, 
  X, 
  AlertCircle,
  Clock,
  MapPin,
  Folder,
  Tag,
  Link,
  Paperclip,
  Repeat
} from 'lucide-react';
import { SubtaskItem } from './SubtaskItem';
import { parseNaturalLanguageDate } from '@/utils/nlp';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  isEditing?: boolean;
}

// Dynamic options that use translation keys
const getPriorityOptions = (t: any) => [
  { value: 'P1', label: t('tasks.priority.P1'), color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'P2', label: t('tasks.priority.P2'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'P3', label: t('tasks.priority.P3'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'P4', label: t('tasks.priority.P4'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
];

const getStatusOptions = (t: any) => [
  { value: 'todo', label: t('tasks.status.todo'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  { value: 'in-progress', label: t('tasks.status.in-progress'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'done', label: t('tasks.status.done'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'backlog', label: t('tasks.status.backlog'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
];

const getRecurrenceOptions = (t: any) => [
  { value: 'none', label: t('tasks.recurrence.none') },
  { value: 'daily', label: t('tasks.recurrence.daily') },
  { value: 'weekly', label: t('tasks.recurrence.weekly') },
  { value: 'monthly', label: t('tasks.recurrence.monthly') },
  { value: 'yearly', label: t('tasks.recurrence.yearly') },
  { value: 'custom', label: t('tasks.recurrence.custom') },
];

export function TaskForm({ isOpen, onClose, task, isEditing = false }: TaskFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { createTask, updateTask, projects, tasks } = useAppStore();
  const [newTag, setNewTag] = useState('');
  const [dependencyPopoverOpen, setDependencyPopoverOpen] = useState(false);
  const [startDateString, setStartDateString] = useState('');
  const [dueDateString, setDueDateString] = useState('');

  const getFormDefaults = () => {
    const defaults = {
      title: '',
      notes: '',
      priority: 'P4',
      status: 'todo',
      dueDate: undefined,
      startDate: undefined,
      project: undefined,
      tags: [],
      location: '',
      dependencies: [],
      attachments: [],
      recurrence: { type: 'none', interval: 1 } as RecurrencePattern,
      subtasks: [],
      completed: false,
      linkedItems: { tasks: [], goals: [], reminders: [], events: [] },
    };

    if (isEditing && task) {
      return {
        ...defaults,
        ...task,
        notes: task.notes || '',
        // Ensure recurrence is a valid object
        recurrence: typeof task.recurrence === 'object' && task.recurrence ? task.recurrence : { type: 'none', interval: 1 },
      };
    }
    return defaults;
  };

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: getFormDefaults(),
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const recurrenceType = form.watch('recurrence.type');

  useEffect(() => {
    if (isOpen) {
      form.reset(getFormDefaults());
      setNewTag('');
    }
  }, [isOpen, task, isEditing, form]);

  const handleSubmit = async (data: InsertTask) => {
    try {
      if (data.dueDate && data.startDate && new Date(data.dueDate) < new Date(data.startDate)) {
        toast({
          title: t('actions.error'),
          description: 'Due date must be on or after the start date.',
          variant: 'destructive',
        });
        return;
      }

      const sanitizedData = {
        ...data,
        title: data.title.trim(),
        notes: data.notes?.trim() || '',
        location: data.location?.trim() || '',
        project: data.project === 'none' ? undefined : data.project,
        tags: data.tags?.map(tag => tag.trim()).filter(Boolean) || [],
      };

      if (isEditing && task) {
        await updateTask(task.id, sanitizedData);
        toast({
          title: t('actions.update'),
          description: t('tasks.taskUpdatedMessage'),
        });
      } else {
        await createTask(sanitizedData);
        toast({
          title: t('actions.create'),
          description: t('tasks.taskCreatedMessage'),
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('tasks.saveError'),
        variant: 'destructive',
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues('tags')?.includes(newTag.trim())) {
      form.setValue('tags', [...(form.getValues('tags') || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', form.getValues('tags')?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleSaveAsTemplate = async () => {
    const templateName = prompt(t('tasks.templateNamePrompt'));
    if (!templateName || !templateName.trim()) return;

    try {
      const taskData = form.getValues();
      await dbUtils.createTaskTemplate({
        name: templateName.trim(),
        taskData: taskData,
      });
      toast({
        title: t('actions.success'),
        description: t('tasks.templateSavedMessage'),
      });
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('tasks.templateSaveErrorMessage'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {isEditing ? t('tasks.editTask') : t('tasks.createTask')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('tasks.editTaskDescription') : t('tasks.createTaskDescription')}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">{t('tasks.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('tasks.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tasks.notes')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('tasks.notesPlaceholder')} className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t('tasks.selectPriority')} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t('tasks.selectStatus')} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.startDate')}</FormLabel>
                    <Popover>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder={t('tasks.datePlaceholder')}
                            value={field.value ? format(field.value, 'PPP') : startDateString}
                            onChange={(e) => setStartDateString(e.target.value)}
                            onBlur={(e) => {
                              const parsedDate = parseNaturalLanguageDate(e.target.value);
                              if (parsedDate) {
                                field.onChange(parsedDate);
                                setStartDateString(format(parsedDate, 'PPP'));
                              }
                            }}
                          />
                        </FormControl>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="absolute right-0 top-0 h-full px-3" aria-label="Open calendar">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setStartDateString(date ? format(date, 'PPP') : '');
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.dueDate')}</FormLabel>
                     <Popover>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder={t('tasks.datePlaceholder')}
                            value={field.value ? format(field.value, 'PPP') : dueDateString}
                            onChange={(e) => setDueDateString(e.target.value)}
                            onBlur={(e) => {
                              const parsedDate = parseNaturalLanguageDate(e.target.value);
                              if (parsedDate) {
                                field.onChange(parsedDate);
                                setDueDateString(format(parsedDate, 'PPP'));
                              }
                            }}
                          />
                        </FormControl>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="absolute right-0 top-0 h-full px-3" aria-label="Open calendar">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDueDateString(date ? format(date, 'PPP') : '');
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tasks.project')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t('tasks.selectProject')} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('tasks.noProject')}</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence Section */}
            <div className="space-y-2 p-4 border rounded-lg">
              <FormLabel className="flex items-center gap-2"><Repeat className="w-4 h-4" />{t('tasks.recurrence')}</FormLabel>
              <FormField
                control={form.control}
                name="recurrence.type"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        {getRecurrenceOptions(t).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {recurrenceType !== 'none' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recurrence.interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.recurrence_interval')}</FormLabel>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)}
                          value={field.value || 1}
                        />
                      </FormItem>
                    )}
                  />
                  {recurrenceType === 'weekly' && (
                    <FormField
                      control={form.control}
                      name="recurrence.daysOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.recurrence_days')}</FormLabel>
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            value={field.value?.map(String) || []}
                            onValueChange={(value) => field.onChange(value.map(Number))}
                            className="flex flex-wrap gap-1"
                          >
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                              <ToggleGroupItem key={i} value={String(i)} aria-label={day}>
                                {day}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </FormItem>
                      )}
                    />
                  )}
                  {recurrenceType === 'monthly' && (
                     <FormField
                      control={form.control}
                      name="recurrence.dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.recurrence_day_of_month')}</FormLabel>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)}
                             value={field.value || 1}
                          />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <FormLabel>{t('tasks.subtasks')}</FormLabel>
              <div className="space-y-3">
                {subtaskFields.map((field, index) => (
                  <SubtaskItem
                    key={field.id}
                    nestingLevel={0}
                    path={`subtasks.${index}`}
                    remove={removeSubtask}
                    index={index}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendSubtask({ id: nanoid(), title: '', completed: false, subtasks: [] })}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {t('tasks.addSubtask')}
              </Button>
            </div>

            {/* Dependencies and Attachments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dependencies"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2"><Link className="w-4 h-4" />{t('tasks.dependencies')}</FormLabel>
                    <Popover open={dependencyPopoverOpen} onOpenChange={setDependencyPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={dependencyPopoverOpen}
                          className="w-full justify-between"
                        >
                          {t('tasks.selectDependencies')}
                          <PlusIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder={t('tasks.searchTasks')} />
                          <CommandList>
                            <CommandEmpty>{t('tasks.noTasksFound')}</CommandEmpty>
                            <CommandGroup>
                              {tasks
                                .filter(t => t.id !== task?.id) // Prevent self-dependency
                                .map(t => (
                                <CommandItem
                                  key={t.id}
                                  value={t.id}
                                  onSelect={(currentValue) => {
                                    const currentDeps = field.value || [];
                                    if (!currentDeps.includes(t.id)) {
                                      field.onChange([...currentDeps, t.id]);
                                    }
                                    setDependencyPopoverOpen(false);
                                  }}
                                >
                                  {t.title}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="pt-2 flex flex-wrap gap-2">
                      {field.value?.map(depId => {
                        const depTask = tasks.find(t => t.id === depId);
                        return (
                          <Badge key={depId} variant="secondary" className="flex items-center gap-1">
                            {depTask?.title || depId}
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value.filter(id => id !== depId))}
                              className="rounded-full hover:bg-muted-foreground/20"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Paperclip className="w-4 h-4" />{t('tasks.attachments')}</FormLabel>
                    <Textarea placeholder={t('tasks.attachmentsPlaceholder')} {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="justify-between">
              <div>
                <Button type="button" variant="ghost" onClick={handleSaveAsTemplate}>
                  {t('tasks.saveAsTemplate')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? t('status.saving') : isEditing ? t('actions.update') : t('actions.create')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}