import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import {
  format,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { convertToCalendarItems, generateEventInstances, CalendarItem } from '@/utils/calendarHelpers';
import { MiniCalendar } from './MiniCalendar';

export function YearView() {
  const { tasks, calendarEvents, goals, reminders } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);

  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const calendarItems = useMemo(() => {
    const eventInstances = generateEventInstances(calendarEvents, yearStart, yearEnd);
    return convertToCalendarItems(tasks, eventInstances, goals, reminders);
  }, [tasks, calendarEvents, goals, reminders, yearStart, yearEnd]);

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

  const goToPreviousYear = () => setCurrentDate(prev => new Date(prev.setFullYear(prev.getFullYear() - 1)));
  const goToNextYear = () => setCurrentDate(prev => new Date(prev.setFullYear(prev.getFullYear() + 1)));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="p-4 flex flex-col h-full">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{format(currentDate, 'yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={goToPreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
        {months.map(month => (
          <MiniCalendar
            key={month.toString()}
            month={month}
            itemsByDate={itemsByDate}
            // These props are needed by the component but not used in this read-only view
            selectedDate={new Date()}
            onDateSelect={() => {}}
            items={[]} // Pass empty array as items are handled by itemsByDate
            showWorkload={true}
          />
        ))}
      </div>
    </div>
  );
}
