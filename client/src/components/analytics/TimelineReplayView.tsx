import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Task, CalendarEvent } from '@shared/schema';
import { isSameDay, format, startOfDay, endOfDay, setHours } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Rewind, FastForward } from 'lucide-react';

type ReplayItem = {
  id: string;
  title: string;
  time: Date;
  type: 'task' | 'event';
};

const HOURS_IN_DAY = 24; // Display a full 24-hour timeline

export function TimelineReplayView() {
  const { tasks, calendarEvents } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayTime, setReplayTime] = useState<Date | null>(null);
  const [speed, setSpeed] = useState(100); // Milliseconds per minute of replay
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const replayItems = useMemo(() => {
    // ... (same as before)
  }, [selectedDate, tasks, calendarEvents]);

  // Animation/Playback Logic
  useEffect(() => {
    if (isPlaying && selectedDate) {
      const dayStart = startOfDay(selectedDate);
      if (!replayTime) {
        setReplayTime(dayStart);
      }

      intervalRef.current = setInterval(() => {
        setReplayTime(prevTime => {
          if (!prevTime) return null;
          const newTime = new Date(prevTime.getTime() + 60 * 1000); // Add one minute
          if (newTime >= endOfDay(selectedDate)) {
            setIsPlaying(false);
            return endOfDay(selectedDate);
          }
          return newTime;
        });
      }, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, selectedDate]);

  const handlePlayPause = () => {
    if (!selectedDate) return;
    if (replayTime && replayTime >= endOfDay(selectedDate)) {
        setReplayTime(startOfDay(selectedDate));
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    if(selectedDate) {
        setReplayTime(startOfDay(selectedDate));
    }
  }

  const visibleItems = replayTime ? replayItems.filter(item => item.time <= replayTime) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Replay</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Select a day to replay</h3>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        setSelectedDate(date);
                        setIsPlaying(false);
                        if (date) setReplayTime(startOfDay(date));
                    }}
                    className="rounded-md border"
                />
            </div>
            <div>
                <h3 className="font-semibold mb-2">Controls</h3>
                <div className="flex items-center gap-2">
                    <Button onClick={handleReset} variant="outline" size="icon"><Rewind className="w-4 h-4"/></Button>
                    <Button onClick={handlePlayPause} size="icon">
                        {isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                    </Button>
                </div>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="speed">Speed</Label>
                    <Slider
                        id="speed"
                        min={10}
                        max={200}
                        step={10}
                        value={[210 - speed]}
                        onValueChange={(value) => setSpeed(210 - value[0])}
                    />
                </div>
            </div>
        </div>
        <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">
                Activity for {selectedDate ? format(selectedDate, 'PPP') : '...'}
                {replayTime && <span className="ml-4 font-mono text-primary">{format(replayTime, 'HH:mm')}</span>}
            </h3>
            <div className="relative border rounded-lg p-4 h-[600px] overflow-y-auto">
                {/* Hour markers */}
                {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
                    <div key={hour} className="relative border-b h-[60px]">
                        <span className="absolute -left-10 text-xs text-muted-foreground">{`${hour}:00`}</span>
                    </div>
                ))}

                {/* Replay Items */}
                <AnimatePresence>
                {visibleItems.map((item, index) => {
                    const topPosition = (item.time.getHours() * 60 + item.time.getMinutes()) / (HOURS_IN_DAY * 60) * 100;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-2 right-2 p-2 rounded-md shadow text-white text-xs"
                            style={{ top: `${topPosition}%`, backgroundColor: item.type === 'task' ? '#3b82f6' : '#10b981' }}
                        >
                            {item.title}
                        </motion.div>
                    )
                })}
                </AnimatePresence>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
