import React from 'react';
import { useAppStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { X, CheckSquare, Calendar, Target, Bell } from 'lucide-react';
import { TaskItem } from '../tasks/TaskItem';

const iconMap = {
  Task: CheckSquare,
  Event: Calendar,
  Goal: Target,
  Reminder: Bell,
};

export function FocusView() {
  const {
    isFocusModeActive,
    focusedItemId,
    exitFocusMode,
    tasks,
    calendarEvents,
    goals,
    reminders
  } = useAppStore();

  const focusedItem = React.useMemo(() => {
    if (!focusedItemId) return null;

    const allItems = [
        ...tasks.map(t => ({...t, itemType: 'Task'})),
        ...calendarEvents.map(e => ({...e, itemType: 'Event'})),
        ...goals.map(g => ({...g, itemType: 'Goal'})),
        ...reminders.map(r => ({...r, itemType: 'Reminder'}))
    ];

    return allItems.find(item => item.id === focusedItemId);
  }, [focusedItemId, tasks, calendarEvents, goals, reminders]);

  const Icon = focusedItem ? iconMap[focusedItem.itemType as keyof typeof iconMap] : null;

  return (
    <AnimatePresence>
      {isFocusModeActive && focusedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-2xl"
          >
            <Card className="shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-3">
                        {Icon && <Icon className="w-6 h-6" />}
                        <span>{focusedItem.title}</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={exitFocusMode}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <CardDescription>
                  This is your focus for now. Complete it to move on.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                    {focusedItem.description || focusedItem.notes || 'No description available.'}
                </p>
                {/* We could render a more detailed view of the item here later */}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={exitFocusMode}>End Focus Session</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
