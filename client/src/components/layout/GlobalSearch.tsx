import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { globalSearch, SearchResult } from '@/utils/search';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, CheckSquare, Calendar, Target, Bell } from 'lucide-react';

const iconMap = {
  Task: CheckSquare,
  Event: Calendar,
  Goal: Target,
  Reminder: Bell,
};

export function GlobalSearch() {
  const { t } = useTranslation();
  const store = useAppStore.getState();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const searchResults = globalSearch(query, store);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [query, store]);

  const handleSelect = (result: SearchResult) => {
    console.log('Selected:', result);
    setIsOpen(false);
    setQuery('');
    // Here you would typically navigate to the item
    // e.g., router.push(`/${result.type.toLowerCase()}s/${result.id}`);
  };

  const groupedResults = results.reduce((acc, result) => {
    (acc[result.type] = acc[result.type] || []).push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>{t('actions.search')}...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder={t('actions.search_placeholder')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{query.length > 1 ? t('common.no_results') : 'Type to search...'}</CommandEmpty>
          {Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={type}>
              {items.map(item => {
                const Icon = iconMap[item.type];
                return (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
