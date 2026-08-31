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
  getProjectAnalyticsAction,
  getProjectProductsAction,
  deleteProjectProductAction,
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
import {
  ArrowLeft,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  Copy,
  Check,
  BarChart2,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'products'
  >('overview');

  const [indexedProducts, setIndexedProducts] = useState<any[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [productsTotal, setProductsTotal] = useState(0);
  const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(
    null,
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
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
    navigator.clipboard.writeText(
      `<div id="saas-search-widget" data-project-id="${projectId}" data-api-url="http://localhost:4001"></div>\n<script src="http://localhost:3001/widget.js" defer></script>`,
    );
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

  const fetchDocuments = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoadingDocs(true);
      try {
        const documentsData = await getProjectDocumentsAction(
          projectId,
          docsPage,
        );
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
    },
    [projectId, docsPage],
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const fetchProducts = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoadingProducts(true);
      try {
        const productsData = await getProjectProductsAction(
          projectId,
          productsPage,
        );
        if (productsData.success && productsData.data) {
          setIndexedProducts(productsData.data.products || []);
          setProductsTotalPages(productsData.data.totalPages || 1);
          setProductsTotal(productsData.data.total || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (showLoading) setIsLoadingProducts(false);
      }
    },
    [projectId, productsPage],
  );

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;
    setIsLoading(true);
    setDomainError('');

    let cleanDomainName = newDomainName.trim().toLowerCase();
    try {
      // If user pasted a full URL (e.g., https://digiato.com/), extract just the hostname
      if (
        cleanDomainName.startsWith('http://') ||
        cleanDomainName.startsWith('https://')
      ) {
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
      const crawlRes = await crawlUrlAction(
        projectId,
        `https://${cleanDomainName}`,
        cleanDomainName,
      );
      if (crawlRes.error) {
        toast.error(`Auto-crawl failed: ${crawlRes.error}`);
      } else {
        toast.success(
          `Crawling started! Finding pages for ${cleanDomainName}...`,
        );
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
      setDocsTotal((prev) => prev - 1);
      setSearchResults(searchResults.filter((r) => r.id !== documentId));
    }
    setIsDeletingDoc(null);
  };

  const handleDeleteAllDocuments = async () => {
    if (
      !confirm(
        'Are you sure you want to delete ALL indexed pages? This cannot be undone.',
      )
    )
      return;
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
    if (
      !confirm(
        'Are you sure you want to clear the crawler queue? This will stop any pending crawls for this project.',
      )
    )
      return;
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
        <Button
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('products')}
          className="gap-2"
        >
          <Package className="h-4 w-4" /> Products
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
                <h1 className="text-3xl font-bold tracking-tight">
                  {project.name}
                </h1>
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
                <Button
                  type="submit"
                  disabled={isLoading || !newDomainName.trim()}
                >
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
                        <span className="font-medium truncate">
                          {domain.name}
                        </span>
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
                  View and manage links that have been indexed for your project.
                  (Total: {docsTotal})
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDocuments(true)}
                  disabled={isLoadingDocs}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isLoadingDocs ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearQueue}
                  disabled={isClearingQueue}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {isClearingQueue ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear Queue
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAllDocuments}
                  disabled={isDeletingAll || indexedDocuments.length === 0}
                >
                  {isDeletingAll ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
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
                            <span
                              className="font-medium truncate"
                              title={doc.title || doc.url}
                            >
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
                          onClick={() => setDocsPage((p) => Math.max(1, p - 1))}
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
                          onClick={() =>
                            setDocsPage((p) => Math.min(docsTotalPages, p + 1))
                          }
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
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                >
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
                Copy and paste this snippet into your website's HTML to install
                the search widget.
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
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Place the snippet just before the closing{' '}
                <code>&lt;/body&gt;</code> tag of your website.
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
                Overview of search activity for {project.name}. Data is updated
                in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : analytics ? (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Searches
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.totalSearches}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Top 10 Queries
                        </CardTitle>
                        <CardDescription>
                          Most frequently searched terms
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.topQueries.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No searches recorded yet.
                          </div>
                        ) : (
                          <ul className="space-y-4">
                            {analytics.topQueries.map((q: any, i: number) => (
                              <li
                                key={i}
                                className="flex justify-between items-center border-b pb-2 last:border-0"
                              >
                                <span className="font-medium">{q.term}</span>
                                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                                  {q.count}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Zero-Result Queries
                        </CardTitle>
                        <CardDescription>
                          Searches that returned no results
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.zeroQueries.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No zero-result searches.
                          </div>
                        ) : (
                          <ul className="space-y-4">
                            {analytics.zeroQueries.map((q: any, i: number) => (
                              <li
                                key={i}
                                className="flex justify-between items-center border-b pb-2 last:border-0"
                              >
                                <span className="font-medium">{q.term}</span>
                                <span className="text-sm bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                                  {q.count}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Failed to load analytics.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card className="shadow-sm mt-8 border-gray-100 dark:border-gray-800 dark:bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Indexed Products
              </CardTitle>
              <CardDescription>
                Products automatically detected and indexed by the crawler. Total: {productsTotal}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchProducts(true)}
              disabled={isLoadingProducts}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingProducts && indexedProducts.length === 0 ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : indexedProducts.length === 0 ? (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-medium text-gray-600 dark:text-gray-300">No products found</p>
                <p className="text-sm mt-1">The crawler hasn't found any valid e-commerce products yet.</p>
              </div>
            ) : (
              <div className="bg-gray-50/20 dark:bg-gray-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                  {indexedProducts.map((product) => (
                    <div key={product.id} className="group flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/5 dark:hover:shadow-blue-900/20 transition-all duration-300 overflow-hidden">
                      {/* Image Area */}
                      <div className="relative aspect-square bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-hidden flex items-center justify-center p-6">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.title} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <Package className="w-16 h-16 text-gray-200 dark:text-gray-700" />
                        )}
                        
                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm ${product.in_stock === false ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'}`}>
                            {product.in_stock === false ? 'Out of Stock' : 'In Stock'}
                          </span>
                        </div>
                        

                      </div>
                      
                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1">
                        {product.brand && (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-wide">{product.brand}</span>
                        )}
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-snug mb-3 flex-1" title={product.title}>
                          {product.title}
                        </h4>
                        
                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-end justify-between gap-2">
                          <div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">Price</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {product.price ? (
                                <>
                                  {product.price.toLocaleString()} <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-0.5">{product.currency || 'Toman'}</span>
                                </>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 font-normal">Contact for price</span>
                              )}
                            </div>
                          </div>
                          <a 
                            href={product.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="View original product"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {productsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {productsPage} of {productsTotalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productsPage === 1 || isLoadingProducts}
                        onClick={() => setProductsPage(prev => Math.max(1, prev - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productsPage === productsTotalPages || isLoadingProducts}
                        onClick={() => setProductsPage(prev => Math.min(productsTotalPages, prev + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
