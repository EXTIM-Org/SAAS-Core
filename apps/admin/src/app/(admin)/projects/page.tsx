import { getAdminProjects } from '../../actions/admin';
import { ShieldAlert, ServerCog } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProjectsTable } from './projects-table';

export default async function ProjectsPage() {
  const { data: projects, error } = await getAdminProjects();

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load projects: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Projects Management
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <ServerCog className="w-4 h-4" />
          Manage all tenant projects and set per-project crawl intervals.
        </p>
      </div>

      <ProjectsTable projects={projects || []} />
    </div>
  );
}
