import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { Task, TaskTemplate } from '@shared/schema';
import { isDueToday, isOverdue } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskItem } from '@/components/tasks/TaskItem';
import { KanbanView } from '@/components/tasks/KanbanView';
import { TimelineView } from '@/components/tasks/TimelineView';
import { PriorityBoardView } from '@/components/tasks/PriorityBoardView';
import { TemplateSelectionModal } from '@/components/modals/TemplateSelectionModal';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  FilePlus2,
  Clock,
  Signal
} from 'lucide-react';

export function Tasks() {
  const { t } = useTranslation();
  const { tasks, projects, settings } = useAppStore();
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleSelectTemplate = (template: TaskTemplate) => {
    setEditingTask(template.taskData as any); // Pre-fill form with template data
    setIsTaskFormOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = filterProject === 'all' || task.project === filterProject;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    
    return matchesSearch && matchesProject && matchesPriority && matchesStatus;
  });

  const sortedTasks = useMemo(() => {
    const sortable = [...filteredTasks];
    const mood = settings?.mood || 'normal';

    if (mood === 'normal') {
      // Default sort: due date ascending, then priority
      return sortable.sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.priority.localeCompare(b.priority);
      });
    }

    const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 };
    if (mood === 'high-energy') {
      return sortable.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    if (mood === 'low-energy') {
      return sortable.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }

    return sortable;
  }, [filteredTasks, settings?.mood]);

  const todayTasks = sortedTasks.filter(task => !task.completed && task.dueDate && isDueToday(task.dueDate));
  const upcomingTasks = sortedTasks.filter(task => !task.completed && task.dueDate && !isDueToday(task.dueDate) && !isOverdue(task.dueDate));
  const overdueTasks = sortedTasks.filter(task => !task.completed && task.dueDate && isOverdue(task.dueDate));
  const completedTasks = sortedTasks.filter(task => task.completed);
  const noDueDateTasks = sortedTasks.filter(task => !task.dueDate && !task.completed);
  const inProgressTasks = sortedTasks.filter(task => task.status === 'in-progress');
  const allIncompleteTasks = sortedTasks.filter(task => !task.completed);

  const TaskSection = ({ tasks, title, emptyMessage }: { tasks: Task[]; title: string; emptyMessage: string; }) => (
    <Card>
      <CardHeader><CardTitle className="flex items-center justify-between">{title}<Badge variant="secondary">{tasks.length}</Badge></CardTitle></CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => <TaskItem key={task.id} task={task} onEdit={handleEditTask} showProject={filterProject === 'all'} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">{t('tasks.title')}</h1>
          <p className="text-muted-foreground">{t('tasks.subtitle', { active: allIncompleteTasks.length, completed: completedTasks.length })}</p>
        </div>
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value)} aria-label={t('tasks.view_toggle_aria_label')}>
            <ToggleGroupItem value="list" aria-label={t('tasks.list_view_aria')}><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label={t('tasks.kanban_view_aria')}><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="timeline" aria-label={t('tasks.timeline_view_aria')}><Clock className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="priority" aria-label={t('tasks.priority_board_view_aria')}><Signal className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
            <FilePlus2 className="h-4 w-4 mr-2" />
            {t('tasks.newFromTemplate')}
          </Button>
          <Button onClick={handleCreateTask}><Plus className="w-4 h-4 mr-2" />{t('tasks.add_task')}</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Label htmlFor="search-tasks" className="sr-only">{t('actions.search')}</Label>
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input id="search-tasks" placeholder={t('actions.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div>
              <Label htmlFor="filter-project" className="sr-only">{t('tasks.all_projects')}</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger id="filter-project" className="w-full sm:w-48"><SelectValue placeholder={t('tasks.all_projects')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('tasks.all_projects')}</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-priority" className="sr-only">{t('tasks.priority.title')}</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger id="filter-priority" className="w-full sm:w-32"><SelectValue placeholder={t('tasks.priority.title')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="P1">{t('tasks.priority.p1')}</SelectItem>
                  <SelectItem value="P2">{t('tasks.priority.p2')}</SelectItem>
                  <SelectItem value="P3">{t('tasks.priority.p3')}</SelectItem>
                  <SelectItem value="P4">{t('tasks.priority.p4')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status" className="sr-only">{t('tasks.status.title')}</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status" className="w-full sm:w-32"><SelectValue placeholder={t('tasks.status.title')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('tasks.all_statuses')}</SelectItem>
                  <SelectItem value="todo">{t('tasks.status.todo')}</SelectItem>
                  <SelectItem value="in-progress">{t('tasks.status.in_progress')}</SelectItem>
                  <SelectItem value="done">{t('tasks.status.done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === 'list' && (
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="today">{t('tasks.today')}</TabsTrigger>
            <TabsTrigger value="upcoming">{t('tasks.upcoming')}</TabsTrigger>
            <TabsTrigger value="overdue">{t('tasks.overdue')}</TabsTrigger>
            <TabsTrigger value="in-progress">{t('tasks.status.in_progress')}</TabsTrigger>
            <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
            <TabsTrigger value="completed">{t('tasks.completed')}</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-6"><TaskSection tasks={todayTasks} title={t('tasks.due_today')} emptyMessage={t('tasks.no_due_today')} /></TabsContent>
          <TabsContent value="upcoming" className="mt-6"><TaskSection tasks={upcomingTasks} title={t('tasks.upcoming')} emptyMessage={t('tasks.no_upcoming')} /></TabsContent>
          <TabsContent value="overdue" className="mt-6"><TaskSection tasks={overdueTasks} title={t('tasks.overdue')} emptyMessage={t('tasks.no_overdue')} /></TabsContent>
          <TabsContent value="in-progress" className="mt-6"><TaskSection tasks={inProgressTasks} title={t('tasks.in_progress_title')} emptyMessage={t('tasks.no_in_progress')} /></TabsContent>
          <TabsContent value="all" className="mt-6"><TaskSection tasks={allIncompleteTasks} title={t('tasks.all_tasks')} emptyMessage={t('tasks.no_tasks')} /></TabsContent>
          <TabsContent value="completed" className="mt-6"><TaskSection tasks={completedTasks} title={t('tasks.completed')} emptyMessage={t('tasks.no_completed')} /></TabsContent>
        </Tabs>
      )}
      {view === 'kanban' && <KanbanView />}
      {view === 'timeline' && <TimelineView />}
      {view === 'priority' && <PriorityBoardView />}

      <TaskForm isOpen={isTaskFormOpen} onClose={handleCloseTaskForm} task={editingTask} isEditing={!!editingTask} />
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
