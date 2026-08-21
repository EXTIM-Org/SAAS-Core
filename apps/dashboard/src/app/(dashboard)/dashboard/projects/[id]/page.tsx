'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject } from '@/app/actions/projects';
import {
  getDomains,
  createDomainAction,
  deleteDomainAction,
} from '@/app/actions/domains';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
}

interface Domain {
  id: string;
  name: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomainName, setNewDomainName] = useState('');
  const [error, setError] = useState('');
  const [domainError, setDomainError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectData, domainsData] = await Promise.all([
          getProject(projectId),
          getDomains(projectId),
        ]);
        setProject(projectData);
        setDomains(domainsData);
      } catch (e) {
        const err = e as Error;
        setError(err.message || 'Failed to fetch project details');
      } finally {
        setInitialLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;
    setIsLoading(true);
    setDomainError('');

    const res = await createDomainAction({ name: newDomainName, projectId });
    if (res.error) {
      setDomainError(res.error);
    } else {
      setDomains([...domains, res.data]);
      setNewDomainName('');
    }
    setIsLoading(false);
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    setDomainError('');
    const res = await deleteDomainAction(id);
    if (res.error) {
      setDomainError(res.error);
    } else {
      setDomains(domains.filter((d) => d.id !== id));
    }
  };

  if (initialLoading) {
    return <p>Loading project...</p>;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <p className="text-destructive">{error || 'Project not found'}</p>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <p className="text-muted-foreground">
          Manage details and domains for this project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription>
            Manage domains associated with {project.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleCreateDomain} className="flex gap-4">
            <Input
              type="text"
              placeholder="example.com"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              disabled={isLoading}
              className="max-w-sm"
            />
            <Button type="submit" disabled={isLoading || !newDomainName.trim()}>
              {isLoading ? 'Adding...' : 'Add Domain'}
            </Button>
          </form>
          {domainError && (
            <p className="text-sm font-medium text-destructive">
              {domainError}
            </p>
          )}

          <div className="rounded-md border">
            {domains.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No domains added yet.
              </div>
            ) : (
              <ul className="divide-y">
                {domains.map((domain) => (
                  <li
                    key={domain.id}
                    className="flex items-center justify-between p-4"
                  >
                    <span className="font-medium">{domain.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
