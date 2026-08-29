'use client';

import { useState } from 'react';
import { updateSystemSettings } from '../../actions/admin';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SettingsProps {
  defaultAutoCrawlIntervalDays: number;
}

export function SettingsForm({ initialSettings }: { initialSettings: SettingsProps }) {
  const [interval, setInterval] = useState(initialSettings.defaultAutoCrawlIntervalDays.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const days = parseInt(interval, 10);
      if (isNaN(days) || days < 1) {
        toast.error('Please enter a valid number greater than 0');
        setLoading(false);
        return;
      }

      const res = await updateSystemSettings(days);
      if (res.error) throw new Error(res.error);
      
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Global Crawl Settings</CardTitle>
          <CardDescription>
            Configure the default interval for automatic background crawling of domains.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intervalDays">Default Crawl Interval (Days)</Label>
            <Input
              id="intervalDays"
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              placeholder="30"
            />
            <p className="text-sm text-muted-foreground">
              New domains will use this interval. You can override it per domain later.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
