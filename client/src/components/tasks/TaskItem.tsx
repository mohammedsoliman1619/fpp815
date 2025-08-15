import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Task, Subtask } from '@shared/schema';
import { useAppStore } from '@/lib/store';
import { formatDate, isDueToday, isOverdue } from '@/utils/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  MapPin,
  Folder,
  Tag,
  CheckCircle2,
  Circle,
  Play,
  Link,
  Paperclip,
  Repeat,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { SubtaskListItem } from './SubtaskListItem';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  showProject?: boolean;
}

const priorityConfig = {
  P1: { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  P2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  P3: { label: 'Normal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  P4: { label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  'done': { label: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  'backlog': { label: 'Backlog', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

export function TaskItem({ task, onEdit, showProject = true }: TaskItemProps) {
  const { t } = useTranslation();
  const { toggleTaskCompletion, deleteTask, projects } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [subtasksVisible, setSubtasksVisible] = useState(false);

  const project = projects.find(p => p.id === task.project);
  const priority = priorityConfig[task.priority] || priorityConfig.P4;
  const status = statusConfig[task.status] || statusConfig.todo;

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasSubtasks = totalSubtasks > 0;

  const dueDateStatus = task.dueDate
    ? isOverdue(task.dueDate)
      ? { label: t('tasks.overdue'), color: 'text-red-500' }
      : isDueToday(task.dueDate)
      ? { label: t('tasks.dueToday'), color: 'text-orange-500' }
      : null
    : null;

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => toggleTaskCompletion(task.id)}
            className="mt-1"
            aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
          />
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold leading-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                {task.notes && (
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{task.notes}</ReactMarkdown>
                  </div>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}><Edit className="w-4 h-4 mr-2" />{t('common.edit')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-500"><Trash2 className="w-4 h-4 mr-2" />{isDeleting ? t('common.deleting') : t('common.delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-sm">
              <Badge className={status.color}>{status.label}</Badge>
              <Badge className={priority.color}>{priority.label}</Badge>
              {showProject && project && <Badge variant="outline"><Folder className="w-3 h-3 mr-1" />{project.name}</Badge>}
              {task.location && <div className="flex items-center text-muted-foreground"><MapPin className="w-3 h-3 mr-1" /><span>{task.location}</span></div>}
            </div>

            {task.dueDate && (
              <div className={`flex items-center text-sm ${dueDateStatus?.color || 'text-muted-foreground'}`}>
                <Calendar className="w-4 h-4 mr-2" />
                <span>{dueDateStatus?.label || `${t('tasks.due')} ${formatDate(task.dueDate)}`}</span>
                {task.recurrence?.type !== 'none' && (
                  <Badge variant="outline" className="ml-2"><Repeat className="w-3 h-3 mr-1" />{t(`tasks.recurrence.${task.recurrence?.type}`)}</Badge>
                )}
              </div>
            )}

            {hasSubtasks && (
              <div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span>{t('tasks.subtasksProgress', { completed: completedSubtasks, total: totalSubtasks })}</span>
                  <div className="ml-2 flex-1 max-w-xs bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}/></div>
                  <Button variant="ghost" size="sm" onClick={() => setSubtasksVisible(!subtasksVisible)}>
                    {subtasksVisible ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
                {subtasksVisible && (
                  <div className="mt-2 space-y-1">
                    {task.subtasks.map(st => (
                      <SubtaskListItem
                        key={st.id}
                        taskId={task.id}
                        subtask={st}
                        nestingLevel={0}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {task.dependencies && task.dependencies.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Link className="w-4 h-4" />
                {task.dependencies.map((dep, i) => <Badge key={i} variant="secondary">{dep}</Badge>)}
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Paperclip className="w-4 h-4" />
                {task.attachments.map((att, i) => <Badge key={i} variant="secondary">{att}</Badge>)}
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {task.tags.map((tag, i) => <Badge key={i} variant="secondary">{tag}</Badge>)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}