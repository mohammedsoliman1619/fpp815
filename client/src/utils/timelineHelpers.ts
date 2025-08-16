import { Task, CalendarEvent } from '@shared/schema';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type TimelineDataItem = {
  name: string;
  range: [number, number];
  type: 'task' | 'event';
};

export const processDataForTimeline = (
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  timeScale: 'week' | 'month'
): { data: TimelineDataItem[]; domain: [number, number] } => {
  const now = new Date();
  const viewStart = timeScale === 'week' ? startOfWeek(now) : startOfMonth(now);
  const viewEnd = timeScale === 'week' ? endOfWeek(now) : endOfMonth(now);

  const filteredTasks = tasks.filter(
    (task): task is Task & { startDate: Date; dueDate: Date } =>
      !!task.startDate && !!task.dueDate && task.dueDate >= viewStart && task.startDate <= viewEnd
  );

  const filteredEvents = calendarEvents.filter(
    (event): event is CalendarEvent & { startDate: Date; endDate: Date } =>
      !!event.startDate && !!event.endDate && event.endDate >= viewStart && event.startDate <= viewEnd
  );

  const taskData: TimelineDataItem[] = filteredTasks.map(task => ({
    name: task.title,
    type: 'task',
    range: [task.startDate.getTime(), task.dueDate.getTime()],
  }));

  const eventData: TimelineDataItem[] = filteredEvents.map(event => ({
    name: event.title,
    type: 'event',
    range: [event.startDate.getTime(), event.endDate.getTime()],
  }));

  const combinedData = [...taskData, ...eventData];

  return {
    data: combinedData,
    domain: [viewStart.getTime(), viewEnd.getTime()],
  };
};
