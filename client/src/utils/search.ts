import { useAppStore } from '@/lib/store';
import { Task, Goal, CalendarEvent, Reminder } from '@shared/schema';

export interface SearchResult {
  id: string;
  title: string;
  type: 'Task' | 'Event' | 'Goal' | 'Reminder';
  icon: React.ElementType;
  originalItem: Task | Goal | CalendarEvent | Reminder;
}

export const globalSearch = (query: string, store: ReturnType<typeof useAppStore.getState>): SearchResult[] => {
  const { tasks, goals, calendarEvents, reminders } = store;
  const lowerCaseQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  if (!query) {
    return [];
  }

  // Search Tasks
  tasks.forEach(task => {
    if (
      task.title.toLowerCase().includes(lowerCaseQuery) ||
      task.notes?.toLowerCase().includes(lowerCaseQuery)
    ) {
      results.push({
        id: task.id,
        title: task.title,
        type: 'Task',
        icon: 'CheckSquare', // Placeholder for actual icon component
        originalItem: task,
      });
    }
  });

  // Search Events
  calendarEvents.forEach(event => {
    if (
      event.title.toLowerCase().includes(lowerCaseQuery) ||
      event.description?.toLowerCase().includes(lowerCaseQuery)
    ) {
      results.push({
        id: event.id,
        title: event.title,
        type: 'Event',
        icon: 'Calendar', // Placeholder
        originalItem: event,
      });
    }
  });

  // Search Goals
  goals.forEach(goal => {
    if (
      goal.title.toLowerCase().includes(lowerCaseQuery) ||
      goal.description?.toLowerCase().includes(lowerCaseQuery)
    ) {
      results.push({
        id: goal.id,
        title: goal.title,
        type: 'Goal',
        icon: 'Target', // Placeholder
        originalItem: goal,
      });
    }
  });

  // Search Reminders
  reminders.forEach(reminder => {
    if (
      reminder.title.toLowerCase().includes(lowerCaseQuery) ||
      reminder.description?.toLowerCase().includes(lowerCaseQuery)
    ) {
      results.push({
        id: reminder.id,
        title: reminder.title,
        type: 'Reminder',
        icon: 'Bell', // Placeholder
        originalItem: reminder,
      });
    }
  });

  return results;
};
