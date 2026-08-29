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
import { toast } from 'sonner';

type Project = {
  id: string;
  name: string;
  autoCrawlIntervalDays: number | null;
  createdAt: string;
  user: {
    email: string;
  };
  _count: {
    domains: number;
    products: number;
  };
};

export function ProjectsTable({ projects: initialProjects }: { projects: Project[] }) {
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
          p.id === projectId ? { ...p, autoCrawlIntervalDays: interval } : p
        )
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
              <TableCell>{project.user.email}</TableCell>
              <TableCell>{project._count.domains}</TableCell>
              <TableCell>{project._count.products}</TableCell>
              <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  placeholder="Global default"
                  min={0}
                  className="w-full"
                  defaultValue={project.autoCrawlIntervalDays ?? ''}
                  onBlur={(e) => {
                    const currentVal = project.autoCrawlIntervalDays === null ? '' : project.autoCrawlIntervalDays.toString();
                    if (e.target.value !== currentVal) {
                      handleUpdateInterval(project.id, e.target.value);
                    }
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                No projects found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
