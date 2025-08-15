import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskTemplate } from '@shared/schema';
import { dbUtils } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
}

export function TemplateSelectionModal({ isOpen, onClose, onSelectTemplate }: TemplateSelectionModalProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        const fetchedTemplates = await dbUtils.getTaskTemplates();
        setTemplates(fetchedTemplates);
      };
      fetchTemplates();
    }
  }, [isOpen]);

  const handleSelect = (template: TaskTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tasks.selectTemplateTitle')}</DialogTitle>
          <DialogDescription>{t('tasks.selectTemplateDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-center">{t('tasks.noTemplatesFound')}</p>
          ) : (
            templates.map(template => (
              <Card key={template.id} className="hover:bg-accent cursor-pointer" onClick={() => handleSelect(template)}>
                <CardContent className="p-4">
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{t('tasks.templateTaskTitle')}: {template.taskData.title}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
