import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { processDataForTimeline } from '@/utils/timelineHelpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function TimelineView() {
  const { tasks, calendarEvents } = useAppStore();
  const [timeScale, setTimeScale] = useState<'week' | 'month'>('week');

  const { data, domain } = useMemo(() => {
    return processDataForTimeline(tasks, calendarEvents, timeScale);
  }, [tasks, calendarEvents, timeScale]);

  const tickFormatter = (tick: number) => {
    return format(new Date(tick), 'MMM d');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Timeline</CardTitle>
          <ToggleGroup type="single" value={timeScale} onValueChange={(value) => value && setTimeScale(value as any)}>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No items with start and end dates in the current {timeScale}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={data.length * 50 + 60}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={domain}
                scale="time"
                tickFormatter={tickFormatter}
              />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip
                labelFormatter={(value, payload) => payload[0]?.payload.name || ''}
                formatter={(value, name, props) => {
                  if (name === 'range') {
                    const [start, end] = value as [number, number];
                    return [
                      `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
                      'Duration'
                    ];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="range" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
