import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  Clock,
  Target,
  Edit,
  Trash2,
  MapPin,
  Repeat,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  format, 
  isSameDay, 
  isToday, 
  isPast,
  isFuture,
  parseISO,
  startOfDay,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { EventFormModal } from '@/components/modals/EventFormModal';
import { 
  convertToCalendarItems, 
  CalendarItem
} from '@/utils/calendarHelpers';
import { MonthView } from '@/components/calendar/MonthView';
import { YearView } from '@/components/calendar/YearView';
import { cn } from '@/lib/utils';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string, completed?: boolean) => {
  if (completed || status === 'completed') return CheckCircle;
  if (status === 'in_progress') return Circle;
  return AlertCircle;
};

export function Calendar() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { 
    tasks, 
    calendarEvents, 
    goals, 
    reminders,
    updateTask,
    deleteTask,
    deleteReminder,
    deleteCalendarEvent,
  } = useAppStore();

  // State
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [view, setView] = useState('week'); // 'week', 'month', 'year'

  // Generate recurring event instances
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const eventInstances = generateEventInstances(calendarEvents, weekStartDate, weekEndDate);

  // Get calendar items
  const calendarItems = convertToCalendarItems(tasks, eventInstances, goals, reminders, []);

  // Filter items
  const filteredItems = calendarItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = filterProject === 'all' || item.project === filterProject;
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'todo' && (!item.completed && item.status !== 'completed')) ||
      (filterStatus === 'in_progress' && item.status === 'in_progress') ||
      (filterStatus === 'completed' && (item.completed || item.status === 'completed'));
    
    // Date filtering
    const itemDate = item.date ? new Date(item.date) : (item.startTime ? new Date(item.startTime) : null);
    const matchesDate = !itemDate || isSameDay(itemDate, selectedDate);

    return matchesSearch && matchesProject && matchesType && matchesStatus && matchesDate;
  });

  // Group items by status
  const groupedItems = {
    todo: filteredItems.filter(item => !item.completed && item.status !== 'completed' && item.status !== 'in_progress'),
    in_progress: filteredItems.filter(item => item.status === 'in_progress'),
    completed: filteredItems.filter(item => item.completed || item.status === 'completed')
  };

  // Get projects for filter
  const projects = Array.from(new Set(calendarItems.map(item => item.project).filter(Boolean)));

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  // Get dates with events/tasks for visual indicators
  const datesWithItems = new Set(
    calendarItems
      .map(item => {
        const itemDate = item.date ? new Date(item.date) : (item.startTime ? new Date(item.startTime) : null);
        return itemDate ? format(itemDate, 'yyyy-MM-dd') : null;
      })
      .filter(Boolean)
  );

  // Date navigation handlers
  const navigateToPreviousWeek = () => {
    setWeekStartDate(prev => subDays(prev, 7));
  };

  const navigateToNextWeek = () => {
    setWeekStartDate(prev => addDays(prev, 7));
  };

  const navigateToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setWeekStartDate(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedItem(null); // Clear selected item when changing dates
  };

  // Handlers
  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item);
  };

  const handleAddTask = () => {
    setEditingItem(null);
    setIsTaskFormOpen(true);
  };

  const handleAddEvent = () => {
    setEditingItem(null);
    setIsEventFormOpen(true);
  };

  const handleEditItem = (item: CalendarItem) => {
    setEditingItem(item.originalItem);
    if (item.type === 'task') {
      setIsTaskFormOpen(true);
    } else if (item.type === 'event') {
      setIsEventFormOpen(true);
    }
  };

  const handleToggleComplete = async (item: CalendarItem) => {
    try {
      if (item.type === 'task') {
        await updateTask(item.id, { 
          completed: !item.completed,
          status: !item.completed ? 'completed' : 'pending'
        });
        toast({
          title: t('actions.success'),
          description: !item.completed ? t('tasks.taskCompleted') : t('tasks.taskUncompleted')
        });
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('tasks.updateError'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      switch (selectedItem.type) {
        case 'task':
          await deleteTask(selectedItem.id);
          break;
        case 'event':
          await deleteCalendarEvent(selectedItem.id);
          break;
        case 'reminder':
          await deleteReminder(selectedItem.id);
          break;
        // Goals are not deletable from here for now
      }
      toast({
        title: t('actions.success'),
        description: t('calendar.itemDeleted'),
      });
      setSelectedItem(null);
      setIsDeleteAlertOpen(false);
    } catch (error) {
       toast({
        title: t('actions.error'),
        description: t('calendar.deleteError'),
        variant: 'destructive'
      });
    }
  };

  const renderItemCard = (item: CalendarItem) => {
    const StatusIcon = getStatusIcon(item.status || '', item.completed);
    const isOverdue = item.date && isPast(item.date) && !item.completed && item.status !== 'completed';

    return (
      <Card 
        key={item.id}
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md border-l-4',
          selectedItem?.id === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50',
          item.priority === 'high' ? 'border-l-red-500' : 
          item.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500',
          isOverdue ? 'bg-red-50 border-red-200' : ''
        )}
        onClick={() => handleItemClick(item)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 flex-1">
              <StatusIcon className={cn(
                "w-4 h-4 flex-shrink-0",
                item.completed || item.status === 'completed' ? 'text-green-600' : 
                item.status === 'in_progress' ? 'text-blue-600' : 'text-gray-400'
              )} />
              <h3 className={cn(
                "font-medium text-gray-900 truncate",
                item.completed || item.status === 'completed' ? 'line-through text-gray-500' : ''
              )}>
                {item.title}
              </h3>
            </div>
            {item.priority && (
              <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                {t(`common.priority.${item.priority}`)}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-3">
              {item.type === 'task' && <Clock className="w-3 h-3" />}
              {item.type === 'event' && <CalendarIcon className="w-3 h-3" />}
              {item.type === 'goal' && <Target className="w-3 h-3" />}
              <span>
                {item.date && format(parseISO(item.startTime || item.date.toISOString()), 'MMM dd, HH:mm')}
              </span>
            </div>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {t('tasks.overdue')}
              </Badge>
            )}
          </div>

          {item.project && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {item.project}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGroupSection = (title: string, items: CalendarItem[], count: number) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map(renderItemCard)
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Circle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('common.no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailsPanel = () => {
    if (!selectedItem) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <CalendarIcon className="w-16 h-16 mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">{t('calendar.selectItem')}</h3>
          <p className="text-sm text-center">{t('calendar.selectItemDescription')}</p>
        </div>
      );
    }

    const StatusIcon = getStatusIcon(selectedItem.status || '', selectedItem.completed);
    const isOverdue = selectedItem.date && isPast(selectedItem.date) && !selectedItem.completed;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 calendar-details-header">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <StatusIcon className={cn(
                "w-5 h-5",
                selectedItem.completed || selectedItem.status === 'completed' ? 'text-green-600' : 
                selectedItem.status === 'in_progress' ? 'text-blue-600' : 'text-gray-400'
              )} />
              <h2 className={cn(
                "text-xl font-semibold text-gray-900",
                selectedItem.completed || selectedItem.status === 'completed' ? 'line-through text-gray-500' : ''
              )}>
                {selectedItem.title}
              </h2>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <Badge className={cn("text-xs", getPriorityColor(selectedItem.priority || 'low'))}>
                {t(`common.priority.${selectedItem.priority || 'low'}`)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {t(`calendar.${selectedItem.type}`)}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-800 text-xs">
                  {t('tasks.overdue')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 calendar-details-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditItem(selectedItem)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('actions.edit')}
            </Button>
            {selectedItem.type === 'task' && (
              <Button
                variant={selectedItem.completed ? "outline" : "default"}
                size="sm"
                onClick={() => handleToggleComplete(selectedItem)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {selectedItem.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
              </Button>
            )}
             <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteAlertOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('actions.delete')}
            </Button>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Content */}
        <div className="flex-1 overflow-auto space-y-6">
          {/* Description */}
          {selectedItem.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('tasks.taskDescription')}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {t('calendar.dateTime')}
            </h4>
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {selectedItem.date && format(parseISO(selectedItem.startTime || selectedItem.date.toISOString()), 'EEEE, MMMM dd, yyyy')}
              </span>
            </div>
            {selectedItem.startTime && (
              <div className="flex items-center space-x-2 text-gray-600 mt-2">
                <Clock className="w-4 h-4" />
                <span>
                  {format(parseISO(selectedItem.startTime), 'HH:mm')}
                  {selectedItem.endTime && ` - ${format(parseISO(selectedItem.endTime), 'HH:mm')}`}
                </span>
              </div>
            )}
          </div>

          {/* Project */}
          {selectedItem.project && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('tasks.project')}
              </h4>
              <Badge variant="outline">
                {selectedItem.project}
              </Badge>
            </div>
          )}

          {/* Location */}
          {selectedItem.location && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('calendar.location')}
              </h4>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedItem.location}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {selectedItem.tags && selectedItem.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('calendar.tags')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {selectedItem.recurrence && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('calendar.recurring')}
              </h4>
              <div className="flex items-center space-x-2 text-gray-600">
                <Repeat className="w-4 h-4" />
                <span>{t(`calendar.recurrence.${selectedItem.recurrence}`)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDaySelector = () => (
    <div className="bg-white border-b">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={navigateToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-sm font-medium text-gray-600">
            {format(weekStartDate, 'MMMM yyyy')}
          </h3>
          <Button variant="outline" size="sm" onClick={navigateToNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={navigateToToday}>
          {t('calendar.today')}
        </Button>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex items-center space-x-2 px-6 pb-4">
          {weekDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentDay = isToday(date);
            const hasItems = datesWithItems.has(format(date, 'yyyy-MM-dd'));
            
            return (
              <Button
                key={format(date, 'yyyy-MM-dd')}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-shrink-0 flex flex-col items-center p-3 h-auto min-w-[60px] relative",
                  isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                  isCurrentDay && !isSelected && "bg-blue-50 text-blue-600 border-blue-200",
                  hasItems && !isSelected && "font-medium"
                )}
                onClick={() => handleDateSelect(date)}
              >
                <span className="text-xs font-medium">
                  {format(date, 'EEE')}
                </span>
                <span className={cn(
                  "text-sm font-semibold mt-1",
                  isSelected ? "text-white" : isCurrentDay ? "text-blue-600" : "text-gray-900"
                )}>
                  {format(date, 'd')}
                </span>
                {hasItems && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                    isSelected ? "bg-white" : "bg-blue-500"
                  )} />
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-hierarchy-1">{t('calendar.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {isToday(selectedDate) 
                ? t('dashboard.today_summary')
                : format(selectedDate, 'EEEE, MMMM dd, yyyy')
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value)} aria-label="Calendar view">
              <ToggleGroupItem value="week" aria-label="Week view">{t('calendar.week')}</ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month view">{t('calendar.month')}</ToggleGroupItem>
              <ToggleGroupItem value="year" aria-label="Year view">{t('calendar.year')}</ToggleGroupItem>
            </ToggleGroup>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" onClick={handleAddEvent}>
              <Plus className="w-4 h-4 mr-2" />
              {t('calendar.addEvent')}
            </Button>
            <Button onClick={handleAddTask}>
              <Plus className="w-4 h-4 mr-2" />
              {t('tasks.addTask')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('actions.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('tasks.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.allTasks')}</SelectItem>
                <SelectItem value="todo">{t('dashboard.todays_tasks')}</SelectItem>
                <SelectItem value="in_progress">{t('tasks.status.in_progress')}</SelectItem>
                <SelectItem value="completed">{t('tasks.status.completed')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('calendar.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('calendar.allTypes')}</SelectItem>
                <SelectItem value="task">{t('tasks.title')}</SelectItem>
                <SelectItem value="event">{t('calendar.addEvent')}</SelectItem>
                <SelectItem value="goal">{t('goals.title')}</SelectItem>
                <SelectItem value="reminder">{t('reminders.title')}</SelectItem>
              </SelectContent>
            </Select>

            {projects.length > 0 && (
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('tasks.project')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('tasks.allProjects')}</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project} value={project!}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {view === 'week' && (
        <>
          {/* Day Selector */}
          {renderDaySelector()}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden calendar-container">
            {/* Left Panel - Items List */}
            <div className="calendar-left-panel w-96 border-r bg-gray-50 overflow-auto">
              <div className="p-6">
                {renderGroupSection(t('dashboard.todays_tasks'), groupedItems.todo, groupedItems.todo.length)}
                {renderGroupSection(t('tasks.status.in_progress'), groupedItems.in_progress, groupedItems.in_progress.length)}
                {renderGroupSection(t('tasks.status.completed'), groupedItems.completed, groupedItems.completed.length)}
              </div>
            </div>

            {/* Right Panel - Details */}
            <div className="calendar-right-panel flex-1 bg-white">
              <div className="h-full p-6">
                {renderDetailsPanel()}
              </div>
            </div>
          </div>
        </>
      )}
      {view === 'month' && <MonthView />}
      {view === 'year' && <YearView />}

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingItem(null);
        }}
        task={editingItem}
      />

      <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEditingItem(null);
        }}
        event={editingItem}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendar.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('calendar.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Calendar;