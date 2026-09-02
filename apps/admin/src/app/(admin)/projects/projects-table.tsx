'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { updateProjectInterval } from '../../actions/admin';
import { impersonateUserAction } from '../../actions/impersonate';
import { toast } from 'sonner';

type Project = {
  id: string;
  name: string;
  autoCrawlIntervalDays: number | null;
  createdAt: string;
  members?: {
    user: {
      id: string;
      email: string;
    };
  }[];
  _count: {
    domains: number;
    products: number;
  };
};

export function ProjectsTable({
  projects: initialProjects,
}: {
  projects: Project[];
}) {
  const [projects, setProjects] = useState(initialProjects);

  const handleUpdateInterval = async (projectId: string, value: string) => {
    let interval: number | null = null;
    if (value !== '') {
      interval = parseInt(value, 10);
      if (isNaN(interval) || interval < 0) {
        toast.error('Invalid interval value');
        return;
      }
    }

    const res = await updateProjectInterval(projectId, interval);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Project interval updated');
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, autoCrawlIntervalDays: interval } : p,
        ),
      );
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Domains</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[200px]">Crawl Interval (Days)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                {project.members?.[0]?.user?.email || 'Unknown'}
              </TableCell>
              <TableCell>{project._count?.domains || 0}</TableCell>
              <TableCell>{project._count.products}</TableCell>
              <TableCell>
                {new Date(project.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Global default"
                    min={0}
                    className="w-full"
                    defaultValue={project.autoCrawlIntervalDays ?? ''}
                    onBlur={(e) => {
                      const currentVal =
                        project.autoCrawlIntervalDays === null
                          ? ''
                          : project.autoCrawlIntervalDays.toString();
                      if (e.target.value !== currentVal) {
                        handleUpdateInterval(project.id, e.target.value);
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      const ownerId = project.members?.[0]?.user?.id;
                      if (!ownerId) {
                        toast.error('Project has no owner to impersonate');
                        return;
                      }
                      try {
                        await impersonateUserAction(ownerId, project.id);
                      } catch (err) {
                        toast.error('Failed to impersonate user');
                      }
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    View
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground h-24"
              >
                No projects found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
