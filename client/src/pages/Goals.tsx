import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { Goal } from '@shared/schema';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Flame,
  Edit,
  Trash2,
  MoreVertical,
  Repeat
} from 'lucide-react';
import { GoalFormModal } from '@/components/modals/GoalFormModal';
import { HabitLoopForm } from '@/components/goals/HabitLoopForm';
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

export function Goals() {
  const { t } = useTranslation();
  const {
    goals, createGoal, updateGoal, deleteGoal, updateGoalProgress,
    habitLoops, createHabitLoop, updateHabitLoop, deleteHabitLoop
  } = useAppStore();
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHabitLoopForm, setShowHabitLoopForm] = useState(false);
  const [editingLoop, setEditingLoop] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    targetValue: 0,
    unit: '',
    deadline: '',
    isHabit: false
  });

  // Filter goals by category
  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  // Categorize goals
  const activeGoals = filteredGoals.filter(goal => 
    !goal.targetValue || goal.currentValue < goal.targetValue
  );
  const completedGoals = filteredGoals.filter(goal => 
    goal.targetValue && goal.currentValue >= goal.targetValue
  );
  const habitGoals = filteredGoals.filter(goal => goal.isHabit);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    await createGoal({
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      targetValue: newGoal.targetValue || undefined,
      currentValue: 0,
      unit: newGoal.unit,
      deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
      isHabit: newGoal.isHabit,
      streakCount: 0,
      milestones: []
    });

    setNewGoal({
      title: '',
      description: '',
      category: 'personal',
      targetValue: 0,
      unit: '',
      deadline: '',
      isHabit: false
    });
    setIsCreateDialogOpen(false);
  };

  const handleProgressUpdate = async (goalId: string, newValue: number) => {
    await updateGoalProgress(goalId, newValue);
  };

  const handleOpenCreateGoal = () => {
    setEditingGoal(undefined);
    setIsGoalFormOpen(true);
  };

  const handleOpenEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleGoalSubmit = async (data: any) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await createGoal(data);
    }
  };

  const handleDeleteGoal = async () => {
    if (goalToDelete) {
      await deleteGoal(goalToDelete.id);
      setGoalToDelete(null);
    }
  };

  const handleHabitLoopSubmit = async (data: any) => {
    if (editingLoop) {
      await updateHabitLoop(editingLoop.id, data);
    } else {
      await createHabitLoop(data);
    }
    setEditingLoop(null);
    setShowHabitLoopForm(false);
  };

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progressPercentage = goal.targetValue 
      ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
      : 0;
    const isCompleted = goal.targetValue && goal.currentValue >= goal.targetValue;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-hierarchy-3 mb-2">{goal.title}</h3>
              {goal.description && (
                <p className="text-hierarchy-small text-muted-foreground mb-3">
                  {goal.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant={
                  goal.category === 'health' ? 'default' :
                  goal.category === 'work' ? 'secondary' :
                  goal.category === 'personal' ? 'outline' :
                  'default'
                }>
                  {t(`goals.categories.${goal.category}`)}
                </Badge>
                {goal.isHabit && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Habit
                  </Badge>
                )}
              </div>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleOpenEditGoal(goal)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGoalToDelete(goal)} className="text-red-500">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {goal.isHabit ? (
            <div className="space-y-3">
              {goal.streakCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-hierarchy-small font-medium">
                    {goal.streakCount} {t('goals.streak')}
                  </span>
                </div>
              )}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => handleProgressUpdate(goal.id, goal.currentValue + 1)}
                  className="flex-1"
                >
                  Mark Complete Today
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-hierarchy-small">
                <span className="text-muted-foreground">{t('goals.progress')}</span>
                <span className="font-medium">
                  {goal.currentValue}{goal.unit ? ` ${goal.unit}` : ''} / {goal.targetValue}{goal.unit ? ` ${goal.unit}` : ''}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {isCompleted && (
                <div className="flex items-center space-x-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-hierarchy-small font-medium">Completed!</span>
                </div>
              )}
              {goal.deadline && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-hierarchy-small">
                    Due {formatDate(goal.deadline)}
                  </span>
                </div>
              )}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleProgressUpdate(goal.id, goal.currentValue + 1)}
                  disabled={!!isCompleted}
                >
                  +1
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleProgressUpdate(goal.id, goal.currentValue + 5)}
                  disabled={!!isCompleted}
                >
                  +5
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-hierarchy-1">{t('goals.title')}</h1>
          <p className="text-muted-foreground">
            {activeGoals.length} active, {completedGoals.length} completed
          </p>
        </div>
        <Button onClick={handleOpenCreateGoal}>
          <Plus className="w-4 h-4 mr-2" />
          {t('goals.add_goal')}
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Goals Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="loops">Loops</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('common.no_data')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="habits" className="mt-6">
          {habitGoals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No habits created yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habitGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {completedGoals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed goals yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="loops" className="mt-6">
          {showHabitLoopForm ? (
            <HabitLoopForm
              loop={editingLoop}
              onSubmit={handleHabitLoopSubmit}
              onCancel={() => {
                setShowHabitLoopForm(false);
                setEditingLoop(null);
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => {
                  setEditingLoop(null);
                  setShowHabitLoopForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Loop
                </Button>
              </div>
              {habitLoops.length === 0 ? (
                 <Card>
                  <CardContent className="text-center py-12">
                    <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No habit loops created yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {habitLoops.map(loop => (
                    <Card key={loop.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <span className="font-semibold">{loop.name}</span>
                        <div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingLoop(loop);
                            setShowHabitLoopForm(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteHabitLoop(loop.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <GoalFormModal
        isOpen={isGoalFormOpen}
        onClose={() => setIsGoalFormOpen(false)}
        onSubmit={handleGoalSubmit}
        goal={editingGoal}
      />

      <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('goals.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('goals.delete_confirm_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal}>
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
