import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { convertToCalendarItems, generateEventInstances, CalendarItem } from '@/utils/calendarHelpers';

export function MonthView() {
  const { tasks, calendarEvents, goals, reminders } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const viewStart = startOfWeek(monthStart);
  const viewEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: viewStart, end: viewEnd });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarItems = useMemo(() => {
    const eventInstances = generateEventInstances(calendarEvents, viewStart, viewEnd);
    return convertToCalendarItems(tasks, eventInstances, goals, reminders);
  }, [tasks, calendarEvents, goals, reminders, viewStart, viewEnd]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    calendarItems.forEach(item => {
      const dateKey = format(item.startTime, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(item);
    });
    return map;
  }, [calendarItems]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="p-4 flex flex-col h-full">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-7 flex-1 min-h-0">
        {dayNames.map(day => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground pb-2 border-b">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(dateKey) || [];
          return (
            <div
              key={day.toString()}
              className={cn(
                'border-r border-b p-2 flex flex-col min-h-[120px]',
                !isSameMonth(day, currentDate) && 'bg-muted/50 text-muted-foreground',
                isToday(day) && 'bg-blue-50'
              )}
            >
              <time dateTime={dateKey} className={cn('font-semibold', isToday(day) && 'text-blue-600')}>
                {format(day, 'd')}
              </time>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {dayItems.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'text-xs rounded-md px-1.5 py-0.5 text-white truncate',
                      item.color || 'bg-blue-500'
                    )}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    + {dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
