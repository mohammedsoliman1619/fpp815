import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/ui/ThemeProvider';
import { supportedLanguages } from '@/lib/i18n';
import { dbUtils } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  Database,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

export function Settings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useAppStore();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinValue, setPinValue] = useState('');

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-hierarchy-1">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    updateSettings({ theme: newTheme as any });
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };

  const handleMoodChange = (mood: string) => {
    updateSettings({ mood });
  };



  const handleExportData = async () => {
    try {
      const data = await dbUtils.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productiflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: t('actions.success'),
        description: t('settings.export_success'),
      });
      setExportDialogOpen(false);
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('settings.export_error'),
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await dbUtils.importData(text);
      
      toast({
        title: t('actions.success'),
        description: t('settings.import_success'),
      });
      setImportDialogOpen(false);
      
      // Refresh the page to load new data
      window.location.reload();
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('settings.import_error'),
        variant: "destructive",
      });
    }
  };

  const handleResetData = async () => {
    try {
      await dbUtils.resetData();
      toast({
        title: t('actions.success'),
        description: t('settings.reset_success'),
      });
      setIsResetDialogOpen(false);
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('settings.reset_error'),
        variant: "destructive",
      });
    }
  };

  const handlePinToggle = (enabled: boolean) => {
    if (enabled && !pinValue) {
      toast({
        title: t('actions.error'),
        description: t('settings.pin_error'),
        variant: "destructive",
      });
      return;
    }

    updateSettings({
      security: {
        ...settings.security,
        pinEnabled: enabled,
        pin: enabled ? pinValue : undefined
      }
    });

    if (enabled) {
      toast({
        title: t('actions.success'),
        description: t('settings.pin_enabled'),
      });
    } else {
      toast({
        title: t('actions.success'),
        description: t('settings.pin_disabled'),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-hierarchy-1">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>{t('settings.appearance')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('settings.theme')}</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('settings.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                <SelectItem value="system">{t('settings.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>{t('settings.productivity.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('settings.productivity.energy_mood')}</Label>
             <Select value={settings.mood || 'normal'} onValueChange={handleMoodChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('settings.productivity.normal')}</SelectItem>
                <SelectItem value="high-energy">{t('settings.productivity.high_energy')}</SelectItem>
                <SelectItem value="low-energy">{t('settings.productivity.low_energy')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('settings.productivity.energy_mood_description')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>{t('settings.language')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('settings.language')}</Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>



      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>{t('settings.data')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Export Data */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  {t('settings.export_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('settings.export_data_title')}</DialogTitle>
                  <DialogDescription>
                    {t('settings.export_data_description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button onClick={handleExportData}>
                    {t('settings.export_button')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Data */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('settings.import_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('settings.import_data_title')}</DialogTitle>
                  <DialogDescription>
                    {t('settings.import_data_description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Label htmlFor="import-file" className="sr-only">{t('settings.import_data_title')}</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                  />
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                      {t('actions.cancel')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Reset Data */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center justify-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.reset_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('settings.reset_data_title')}</DialogTitle>
                  <DialogDescription>
                    {t('settings.reset_data_description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button variant="destructive" onClick={handleResetData}>
                    {t('settings.reset_all_data_button')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
