import { addDays, addWeeks, addMonths, startOfDay, endOfDay, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from 'date-fns';

export function parseNaturalLanguageDate(text: string): Date | null {
  const now = new Date();
  const lowerText = text.toLowerCase().trim();

  switch (lowerText) {
    case 'today':
      return startOfDay(now);
    case 'tomorrow':
      return startOfDay(addDays(now, 1));
    case 'yesterday':
      return startOfDay(addDays(now, -1));
    case 'next week':
      return startOfDay(addWeeks(now, 1));
    case 'next month':
      return startOfDay(addMonths(now, 1));
    case 'end of day':
        return endOfDay(now);
  }

  if (lowerText.startsWith('next ')) {
    const day = lowerText.split(' ')[1];
    switch(day) {
        case 'monday': return nextMonday(now);
        case 'tuesday': return nextTuesday(now);
        case 'wednesday': return nextWednesday(now);
        case 'thursday': return nextThursday(now);
        case 'friday': return nextFriday(now);
        case 'saturday': return nextSaturday(now);
        case 'sunday': return nextSunday(now);
    }
  }

  // Add more complex parsing logic here as needed
  // For example, "in 3 days", "2 weeks from now", etc.

  // Try parsing with the native Date constructor as a fallback
  const parsedDate = new Date(text);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return null;
}
