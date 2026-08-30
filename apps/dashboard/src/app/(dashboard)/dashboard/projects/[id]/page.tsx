'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject } from '@/app/actions/projects';
import {
  getDomains,
  createDomainAction,
  deleteDomainAction,
} from '@/app/actions/domains';
import { 
  searchProjectAction, 
  crawlUrlAction,
  getProjectDocumentsAction,
  deleteProjectDocumentAction,
  deleteAllProjectDocumentsAction,
  clearProjectQueueAction,
  getProjectAnalyticsAction
} from '@/app/actions/search';
import DashboardLoading from '../../loading';
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
import { ArrowLeft, Trash2, Package, ChevronLeft, ChevronRight, RefreshCw, Save, Copy, Check, BarChart2, LayoutDashboard } from 'lucide-react';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [indexedDocuments, setIndexedDocuments] = useState<any[]>([]);
  const [docsPage, setDocsPage] = useState(1);
  const [docsTotalPages, setDocsTotalPages] = useState(1);
  const [docsTotal, setDocsTotal] = useState(0);
  const [isDeletingDoc, setIsDeletingDoc] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isClearingQueue, setIsClearingQueue] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [analytics, setAnalytics] = useState<{
    totalSearches: number;
    topQueries: { term: string; count: number }[];
    zeroQueries: { term: string; count: number }[];
  } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await getProjectAnalyticsAction(projectId);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);


  const handleCopySnippet = () => {
    navigator.clipboard.writeText(`<div id="saas-search-widget" data-project-id="${projectId}" data-api-url="http://localhost:4001"></div>\n<script src="http://localhost:3001/widget.js" defer></script>`);
    setIsCopied(true);
    toast.success('Snippet copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchInitialData() {
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
    fetchInitialData();
  }, [projectId]);

  const fetchDocuments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingDocs(true);
    try {
      const documentsData = await getProjectDocumentsAction(projectId, docsPage);
      if (documentsData.success && documentsData.data) {
        setIndexedDocuments(documentsData.data.documents || []);
        setDocsTotalPages(documentsData.data.totalPages || 1);
        setDocsTotal(documentsData.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setIsLoadingDocs(false);
    }
  }, [projectId, docsPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;
    setIsLoading(true);
    setDomainError('');

    let cleanDomainName = newDomainName.trim().toLowerCase();
    try {
      // If user pasted a full URL (e.g., https://digiato.com/), extract just the hostname
      if (cleanDomainName.startsWith('http://') || cleanDomainName.startsWith('https://')) {
        cleanDomainName = new URL(cleanDomainName).hostname;
      } else if (cleanDomainName.includes('/')) {
        // Fallback for something like digiato.com/
        cleanDomainName = cleanDomainName.split('/')[0];
      }
    } catch {
      // Ignore URL parsing errors, use original
    }

    const res = await createDomainAction({ name: cleanDomainName, projectId });
    if (res.error) {
      setDomainError(res.error);
    } else {
      setDomains([...domains, res.data]);
      setNewDomainName('');
      
      toast.info('Starting automatic crawling...');
      const crawlRes = await crawlUrlAction(projectId, `https://${cleanDomainName}`, cleanDomainName);
      if (crawlRes.error) {
        toast.error(`Auto-crawl failed: ${crawlRes.error}`);
      } else {
        toast.success(`Crawling started! Finding pages for ${cleanDomainName}...`);
      }
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

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this indexed page?')) return;
    setIsDeletingDoc(documentId);
    const res = await deleteProjectDocumentAction(projectId, documentId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Document deleted successfully');
      setIndexedDocuments(indexedDocuments.filter((d) => d.id !== documentId));
      setDocsTotal(prev => prev - 1);
      setSearchResults(searchResults.filter((r) => r.id !== documentId));
    }
    setIsDeletingDoc(null);
  };

  const handleDeleteAllDocuments = async () => {
    if (!confirm('Are you sure you want to delete ALL indexed pages? This cannot be undone.')) return;
    setIsDeletingAll(true);
    const res = await deleteAllProjectDocumentsAction(projectId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('All documents deleted successfully');
      setIndexedDocuments([]);
      setDocsTotal(0);
      setDocsTotalPages(1);
      setDocsPage(1);
      setSearchResults([]);
    }
    setIsDeletingAll(false);
  };

  const handleClearQueue = async () => {
    if (!confirm('Are you sure you want to clear the crawler queue? This will stop any pending crawls for this project.')) return;
    setIsClearingQueue(true);
    const res = await clearProjectQueueAction(projectId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || 'Crawler queue cleared successfully');
    }
    setIsClearingQueue(false);
  };

  if (initialLoading) {
    return <DashboardLoading />;
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
      <div className="flex items-center gap-4 border-b pb-4">
        <Button 
          variant={activeTab === 'overview' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('overview')}
          className="gap-2"
        >
          <LayoutDashboard className="h-4 w-4" /> Overview
        </Button>
        <Button 
          variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('analytics')}
          className="gap-2"
        >
          <BarChart2 className="h-4 w-4" /> Search Analytics
        </Button>
      </div>

      {activeTab === 'overview' && (
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
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/projects/${projectId}/members`}>
            <Button variant="outline" className="flex items-center gap-2">
              Team Members
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${projectId}/products`}>
            <Button className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Manage Products
            </Button>
          </Link>
        </div>
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
                  >
                    <span className="font-medium truncate">{domain.name}</span>
                    <div className="flex items-center gap-2">

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete Domain"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Indexed Links</CardTitle>
            <CardDescription>
              View and manage links that have been indexed for your project. (Total: {docsTotal})
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments(true)}
              disabled={isLoadingDocs}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingDocs ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearQueue}
              disabled={isClearingQueue}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {isClearingQueue ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear Queue
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteAllDocuments}
              disabled={isDeletingAll || indexedDocuments.length === 0}
            >
              {isDeletingAll ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear All Indexed
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {isLoadingDocs ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : indexedDocuments.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No links indexed yet.
              </div>
            ) : (
              <>
                <ul className="divide-y max-h-96 overflow-y-auto">
                  {indexedDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between p-4 gap-4"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate" title={doc.title || doc.url}>
                          {doc.title || doc.url}
                        </span>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-muted-foreground hover:underline truncate"
                          title={doc.url}
                        >
                          {doc.url}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={isDeletingDoc === doc.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </li>
                  ))}
                </ul>
                {docsTotalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocsPage(p => Math.max(1, p - 1))}
                      disabled={docsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {docsPage} of {docsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocsPage(p => Math.min(docsTotalPages, p + 1))}
                      disabled={docsPage === docsTotalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>
            Copy and paste this snippet into your website's HTML to install the search widget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative group">
            <div className="bg-muted p-4 pr-16 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">
              {`<div id="saas-search-widget" data-project-id="${projectId}" data-api-url="http://localhost:4001"></div>\n<script src="http://localhost:3001/widget.js" defer></script>`}
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary/80"
              onClick={handleCopySnippet}
            >
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Place the snippet just before the closing <code>&lt;/body&gt;</code> tag of your website.
          </p>
        </CardContent>
      </Card>
    </div>
      )}

      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Search Analytics</CardTitle>
              <CardDescription>
                Overview of search activity for {project.name}. Data is updated in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : analytics ? (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalSearches}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top 10 Queries</CardTitle>
                        <CardDescription>Most frequently searched terms</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.topQueries.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No searches recorded yet.</div>
                        ) : (
                          <ul className="space-y-4">
                            {analytics.topQueries.map((q: any, i: number) => (
                              <li key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <span className="font-medium">{q.term}</span>
                                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">{q.count}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Zero-Result Queries</CardTitle>
                        <CardDescription>Searches that returned no results</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.zeroQueries.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No zero-result searches.</div>
                        ) : (
                          <ul className="space-y-4">
                            {analytics.zeroQueries.map((q: any, i: number) => (
                              <li key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <span className="font-medium">{q.term}</span>
                                <span className="text-sm bg-destructive/10 text-destructive px-2 py-1 rounded-full">{q.count}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Failed to load analytics.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
