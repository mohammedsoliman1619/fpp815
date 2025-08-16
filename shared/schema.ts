import { z } from 'zod';

// --- ENHANCED SCHEMAS ---

// Event Reminder Schema
export const eventReminderSchema = z.object({
  id: z.string(),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks']),
  value: z.number().positive(),
});

// Advanced Recurrence Schema
export const recurrenceSchema = z.object({
  type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).default('none'),
  interval: z.number().min(1).default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday
  dayOfMonth: z.number().min(1).max(31).optional(),
  weekOfMonth: z.number().min(1).max(5).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  endDate: z.date().optional(),
});

// Recursive Subtask Schema
// Using z.lazy() to allow for recursive type definition
type SubtaskType = {
  id: string;
  title: string;
  completed: boolean;
  subtasks: SubtaskType[];
};

export const subtaskSchema: z.ZodType<SubtaskType> = z.lazy(() => z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  subtasks: z.array(subtaskSchema).default([]),
}));


// Goal Milestone Schema
export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  targetValue: z.number().min(0),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
});

// Goal Journaling Schema
export const journalEntrySchema = z.object({
  id: z.string(),
  date: z.date(),
  content: z.string().min(1), // Markdown content
  mood: z.enum(['great', 'good', 'neutral', 'bad', 'terrible']).optional(),
});

// Habit Loop Schema
export const habitLoopStepSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  itemType: z.enum(['task', 'reminder']),
  order: z.number(),
});

export const habitLoopSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  steps: z.array(habitLoopStepSchema).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Cross-linking Schema
export const linkedItemsSchema = z.object({
  tasks: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  reminders: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
});

// --- MAIN ENTITY SCHEMAS ---

// Task Schema - Enhanced for enterprise features
const taskSchemaBase = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(), // For rich-text, markdown etc.
  completed: z.boolean().default(false),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P4'),
  status: z.enum(['todo', 'in-progress', 'done', 'backlog']).default('todo'),
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  project: z.string().optional(),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  dependencies: z.array(z.string()).default([]), // For task blocking
  recurrence: recurrenceSchema.optional(),
  subtasks: z.array(subtaskSchema).default([]),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  attachments: z.array(z.string()).default([]), // URLs or identifiers for attachments
  history: z.array(z.object({
    date: z.date(),
    action: z.string(),
    field: z.string().optional(),
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
  })).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Task Schema with validation
export const taskSchema = taskSchemaBase.refine((data) => {
  if (data.startDate && data.dueDate) {
    return data.dueDate >= data.startDate;
  }
  return true;
}, {
  message: "Due date must be on or after the start date",
  path: ["dueDate"],
});

// Project Schema
export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string().default('#6b7280'),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Goal Schema
export const goalSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).default(0),
  unit: z.string().optional(),
  deadline: z.date().optional(),
  startDate: z.date().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string()).default([]),
  isHabit: z.boolean().default(false),
  streakCount: z.number().min(0).default(0),
  lastCompletedDate: z.date().optional(),
  recurrence: recurrenceSchema.optional(),
  milestones: z.array(milestoneSchema).default([]),
  journalEntries: z.array(journalEntrySchema).default([]), // Added for journaling
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Reminder Schema
export const reminderSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  remindAt: z.date(),
  completed: z.boolean().default(false),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(), // For location-based reminders
  recurrence: recurrenceSchema.optional(),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Calendar Event Schema
export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  isAllDay: z.boolean().default(false),
  color: z.string().default('#3b82f6'),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  recurrence: recurrenceSchema.optional(),
  reminders: z.array(eventReminderSchema).default([]),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// --- TYPE EXPORTS ---
export type EventReminder = z.infer<typeof eventReminderSchema>;

// Time Block Schema
export const timeBlockSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startTime: z.date(),
  endTime: z.date(),
  color: z.string().optional(),
  isCompleted: z.boolean().default(false),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// --- INSERT SCHEMAS (for creation) ---
export const insertTaskSchema = taskSchemaBase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalSchema = goalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderSchema = reminderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarEventSchema = calendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeBlockSchema = timeBlockSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Task Template Schema
export const taskTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  taskData: insertTaskSchema, // Re-use the insert schema for the template's data
  createdAt: z.date(),
});

export const insertTaskTemplateSchema = taskTemplateSchema.omit({
  id: true,
  createdAt: true,
});

export const insertHabitLoopSchema = habitLoopSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// --- TYPE EXPORTS ---
export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;

export type Project = z.infer<typeof projectSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Goal = z.infer<typeof goalSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export type Reminder = z.infer<typeof reminderSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type TimeBlock = z.infer<typeof timeBlockSchema>;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;

export type RecurrencePattern = z.infer<typeof recurrenceSchema>;
export type LinkedItems = z.infer<typeof linkedItemsSchema>;

export type TaskTemplate = z.infer<typeof taskTemplateSchema>;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

export type HabitLoop = z.infer<typeof habitLoopSchema>;
export type InsertHabitLoop = z.infer<typeof insertHabitLoopSchema>;
export type HabitLoopStep = z.infer<typeof habitLoopStepSchema>;