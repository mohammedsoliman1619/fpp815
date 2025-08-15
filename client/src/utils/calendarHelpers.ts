
import { format, addDays, addWeeks, addMonths, isSameDay, startOfDay, endOfDay, parseISO, eachDayOfInterval, areIntervalsOverlapping } from 'date-fns';
import { Task, CalendarEvent, Goal, Reminder, TimeBlock, RecurrencePattern } from '@shared/schema';

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  type: 'task' | 'event' | 'goal' | 'reminder' | 'timeblock';
  color?: string;
  project?: string;
  group?: string;
  priority?: string;
  status?: string;
  notes?: string;
  isAutoRolled?: boolean;
  originalItem: Task | Event | Goal | Reminder | TimeBlock;
}

export const generateEventInstances = (
  events: CalendarEvent[],
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] => {
  const instances: CalendarEvent[] = [];

  events.forEach(event => {
    if (!event.recurrence || event.recurrence.type === 'none') {
      // If it's a non-recurring event, just add it if it's in the view
      if (event.startDate >= viewStart && event.startDate <= viewEnd) {
        instances.push(event);
      }
    } else {
      // It's a recurring event, generate instances
      const rule = event.recurrence;
      let currentDate = event.startDate;

      // Iterate from the event's start date until we are past the view window
      while (currentDate <= viewEnd) {
        if (currentDate >= viewStart) {
          // Check if the current date matches the recurrence rule
          let shouldCreate = false;
          switch (rule.type) {
            case 'daily':
              shouldCreate = true;
              break;
            case 'weekly':
              if (rule.daysOfWeek?.includes(currentDate.getDay())) {
                shouldCreate = true;
              }
              break;
            case 'monthly':
              if (rule.dayOfMonth === currentDate.getDate()) {
                shouldCreate = true;
              }
              break;
            case 'yearly':
               if (rule.monthOfYear === (currentDate.getMonth() + 1) && rule.dayOfMonth === currentDate.getDate()) {
                shouldCreate = true;
              }
              break;
          }

          if (shouldCreate) {
            const duration = event.endDate.getTime() - event.startDate.getTime();
            const instanceStartDate = new Date(currentDate);
            const instanceEndDate = new Date(currentDate.getTime() + duration);

            instances.push({
              ...event,
              id: `${event.id}-${format(currentDate, 'yyyy-MM-dd')}`, // Unique ID for the instance
              startDate: instanceStartDate,
              endDate: instanceEndDate,
            });
          }
        }

        // Move to the next potential date based on the rule
        const interval = rule.interval || 1;
        switch (rule.type) {
          case 'daily':
            currentDate = addDays(currentDate, interval);
            break;
          case 'weekly':
             // For weekly, just advance by one day and the check will handle it
            currentDate = addDays(currentDate, 1);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, interval);
            break;
          case 'yearly':
            currentDate = addYears(currentDate, interval);
            break;
          default:
            // Should not happen, but as a fallback, break the loop
            currentDate = addDays(viewEnd, 1);
            break;
        }

        // A safety break for weekly to avoid infinite loops if interval is not handled perfectly
        if (rule.type === 'weekly' && interval > 1) {
            let daysAdvanced = 0;
            while(daysAdvanced < 7 * (interval -1)) {
                currentDate = addDays(currentDate, 1);
                daysAdvanced++;
            }
        }

      }
    }
  });

  return instances;
};

export const calculateWorkload = (items: CalendarItem[], date: Date): number => {
  const dayItems = items.filter(item => isSameDay(item.startTime, date));
  return dayItems.reduce((total, item) => total + (item.duration || 30), 0);
};

export const getWorkloadColor = (minutes: number): string => {
  if (minutes === 0) return 'bg-gray-100';
  if (minutes <= 120) return 'bg-green-200';
  if (minutes <= 240) return 'bg-yellow-200';
  if (minutes <= 360) return 'bg-orange-200';
  return 'bg-red-200';
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const autoRolloverTasks = (tasks: Task[]): Task[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.map(task => {
    if (task.status !== 'completed' && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        return {
          ...task,
          dueDate: today.toISOString(),
          isAutoRolled: true,
        };
      }
    }
    return task;
  });
};

export const validateTimeBlock = (block: Partial<TimeBlock>): string[] => {
  const errors: string[] = [];
  
  if (!block.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!block.startTime) {
    errors.push('Start time is required');
  }
  
  if (!block.endTime) {
    errors.push('End time is required');
  }
  
  if (block.startTime && block.endTime && new Date(block.endTime) <= new Date(block.startTime)) {
    errors.push('End time must be after start time');
  }
  
  if (block.duration && block.duration <= 0) {
    errors.push('Duration must be positive');
  }
  
  return errors;
};

export const convertToCalendarItems = (
  tasks: Task[] = [],
  events: CalendarEvent[] = [],
  goals: Goal[] = [],
  reminders: Reminder[] = [],
  timeBlocks: TimeBlock[] = []
): CalendarItem[] => {
  const items: CalendarItem[] = [];

  // Convert tasks
  (tasks || []).forEach(task => {
    if (task.dueDate) {
      items.push({
        id: task.id,
        title: task.title,
        description: task.notes,
        startTime: new Date(task.dueDate),
        type: 'task',
        color: getProjectColor(task.project),
        project: task.project,
        priority: task.priority,
        status: task.status,
        originalItem: task,
      });
    }
  });

  // Convert events
  (events || []).forEach(event => {
    items.push({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: new Date(event.startDate),
      endTime: event.endDate ? new Date(event.endDate) : undefined,
      type: 'event',
      color: event.color,
      project: undefined, // Events don't have projects in the new schema
      priority: event.priority,
      originalItem: event,
    });
  });

  // Convert goals (if they have due dates)
  (goals || []).forEach(goal => {
    if (goal.deadline) {
      items.push({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        startTime: new Date(goal.deadline),
        type: 'goal',
        color: 'bg-purple-500',
        priority: goal.priority,
        originalItem: goal,
      });
    }
  });

  // Convert reminders
  (reminders || []).forEach(reminder => {
    items.push({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      startTime: new Date(reminder.remindAt),
      type: 'reminder',
      color: 'bg-blue-500',
      priority: reminder.priority,
      originalItem: reminder,
    });
  });

  // Convert time blocks
  (timeBlocks || []).forEach(block => {
    items.push({
      id: block.id,
      title: block.title,
      startTime: new Date(block.startTime),
      endTime: new Date(block.endTime),
      type: 'timeblock',
      color: block.color || 'bg-gray-500',
      originalItem: block,
    });
  });

  return items.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

export const detectConflicts = (
  allItems: CalendarItem[],
  currentItem: Pick<CalendarItem, 'id' | 'startTime' | 'endTime'>
): CalendarItem[] => {
  if (!currentItem.startTime || !currentItem.endTime) {
    return [];
  }

  return allItems.filter(item => {
    // Don't compare item with itself
    if (item.id === currentItem.id) {
      return false;
    }

    if (!item.endTime) {
      // If an item has no end time (e.g., a task with only a due date),
      // we can't check for overlap. We could assume a default duration,
      // but for basic detection, we will skip it.
      return false;
    }

    return areIntervalsOverlapping(
      { start: currentItem.startTime, end: currentItem.endTime },
      { start: item.startTime, end: item.endTime }
    );
  });
};

const getProjectColor = (project?: string): string => {
  if (!project) return 'bg-gray-500';
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  
  const hash = project.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};
