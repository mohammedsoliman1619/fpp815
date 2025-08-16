import React from 'react';
import { useAppStore } from '@/lib/store';
import { generateSuggestions } from '@/utils/suggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export function SmartSuggestions() {
  const { analytics } = useAppStore();
  const suggestions = generateSuggestions(analytics);

  if (suggestions.length === 0) {
    return null; // Don't render anything if there are no suggestions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>Smart Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="text-lg mr-2 mt-1">💡</span>
              <p className="text-muted-foreground">{suggestion}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
