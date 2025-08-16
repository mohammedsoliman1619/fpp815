import { AnalyticsData } from '@/lib/store';
import { endOfWeek, startOfWeek } from 'date-fns';

export const generateSuggestions = (analytics: AnalyticsData | null): string[] => {
  if (!analytics) return [];

  const suggestions: string[] = [];

  // Suggestion 1: Productivity Score
  if (analytics.productivityScore < 50) {
    suggestions.push("Your productivity score is a bit low. Try breaking down larger tasks into smaller, more manageable subtasks.");
  } else if (analytics.productivityScore > 85) {
    suggestions.push("You have an excellent productivity score! Keep up the great work.");
  }

  // Suggestion 2: Most Productive Day
  const dayCounts = analytics.completedTasksByDay.reduce((acc, day) => {
    const dayOfWeek = new Date(day.date).getDay(); // 0 = Sunday, 1 = Monday...
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + day.count;
    return acc;
  }, {} as Record<number, number>);

  if (Object.keys(dayCounts).length > 0) {
    const mostProductiveDayIndex = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    suggestions.push(`You complete the most tasks on ${dayNames[mostProductiveDayIndex]}s. Consider scheduling important work on that day.`);
  }

  // Suggestion 3: Goal Progress
  const stalledGoals = analytics.goalProgress.filter(g => g.progress < 100).slice(0, 1);
  if (stalledGoals.length > 0) {
    suggestions.push(`You're making progress on "${stalledGoals[0].goal}". Keep pushing forward!`);
  }

  // Suggestion 4: Streaks
  if (analytics.streaks.length > 0) {
    const longestStreak = analytics.streaks.reduce((a, b) => a.count > b.count ? a : b);
    suggestions.push(`Your longest active streak is for "${longestStreak.type}" at ${longestStreak.count} days. Amazing consistency!`);
  } else {
     suggestions.push("Try starting a new habit-based goal to build a streak and improve consistency.");
  }

  return suggestions.slice(0, 3); // Return a max of 3 suggestions
};
