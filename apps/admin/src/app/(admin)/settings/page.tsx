import { getSystemSettings } from '../../actions/admin';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const { data: settings, error } = await getSystemSettings();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
      </div>

      {error ? (
        <div className="text-red-500">Failed to load settings: {error}</div>
      ) : (
        <SettingsForm initialSettings={settings || { defaultAutoCrawlIntervalDays: 30 }} />
      )}
    </div>
  );
}
