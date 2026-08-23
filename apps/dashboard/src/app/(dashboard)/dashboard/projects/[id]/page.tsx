'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject } from '@/app/actions/projects';
import {
  getDomains,
  createDomainAction,
  deleteDomainAction,
} from '@/app/actions/domains';
import { searchProjectAction, crawlUrlAction } from '@/app/actions/search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResult } from '@saas/shared';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Trash2, Package } from 'lucide-react';
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

  const [crawlUrl, setCrawlUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim()) return;

    try {
      new URL(crawlUrl);
    } catch {
      toast.error('Please enter a valid URL (e.g. https://example.com/page)');
      return;
    }

    setIsCrawling(true);

    try {
      const urlObj = new URL(crawlUrl);
      const domain = urlObj.hostname;

      // Basic check if the domain belongs to this project
      const hasDomain = domains.some((d) => d.name === domain);
      if (!hasDomain && domains.length > 0) {
        toast.error('The URL domain must match one of your configured domains.');
        setIsCrawling(false);
        return;
      }

      const res = await crawlUrlAction(projectId, crawlUrl, domain);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || 'URL successfully submitted for indexing.');
        setCrawlUrl('');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsCrawling(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    const res = await searchProjectAction(projectId, searchQuery);
    if (res.error) {
      setSearchError(res.error);
    } else if (res.success) {
      setSearchResults(res.data || []);
    }
    setIsSearching(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        <Link href={`/dashboard/projects/${projectId}/products`}>
          <Button className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Manage Products
          </Button>
        </Link>
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

      <Card>
        <CardHeader>
          <CardTitle>Add Link to Index</CardTitle>
          <CardDescription>
            Submit a specific URL to be crawled and indexed immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleCrawlSubmit} className="flex gap-4">
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              disabled={isCrawling}
              className="max-w-sm"
              required
            />
            <Button type="submit" disabled={isCrawling || !crawlUrl.trim()}>
              {isCrawling ? 'Submitting...' : 'Index URL'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Tester</CardTitle>
          <CardDescription>
            Test search functionality for your indexed documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              type="text"
              placeholder="Search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              className="max-w-sm"
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
          {searchError && (
            <p className="text-sm font-medium text-destructive">
              {searchError}
            </p>
          )}

          <div className="rounded-md border">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No search results.
              </div>
            ) : (
              <ul className="divide-y">
                {searchResults.map((result, index) => (
                  <li
                    key={result.id || index}
                    className="p-4 flex flex-col gap-1"
                  >
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {result.title || result.url}
                    </a>
                    <span className="text-xs text-muted-foreground break-all">
                      {result.url}
                    </span>
                    <p className="text-sm mt-1 line-clamp-2">
                      {result.content ||
                        result.snippet ||
                        'No content snippet available.'}
                    </p>
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
