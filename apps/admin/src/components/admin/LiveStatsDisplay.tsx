'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Globe,
  Database,
  Server,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  ArrowLeftRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Animation variants for numbers
const numberVariant = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, y: 10 },
};

// A helper component to animate changing numbers
const AnimatedNumber = ({
  value,
  className = 'text-3xl font-bold',
}: {
  value: string | number;
  className?: string;
}) => (
  <div className="overflow-hidden h-10">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={value}
        variants={numberVariant}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {value}
      </motion.div>
    </AnimatePresence>
  </div>
);

export function LiveStatsDisplay({
  initialStats,
  token,
}: {
  initialStats: any;
  token: string;
}) {
  const [stats, setStats] = useState(initialStats);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [retryingJob, setRetryingJob] = useState<string | null>(null);

  const handleRetry = async (jobId: string) => {
    try {
      setRetryingJob(jobId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
        `${apiUrl}/search/admin/queue/retry/${jobId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error('Failed to retry job');
    } catch (err) {
      console.error(err);
      alert('Failed to retry job. Please try again.');
    } finally {
      setTimeout(() => setRetryingJob(null), 1000); // Keep loading state a bit for UX
    }
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      // Establish SSE Connection to Core API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      eventSource = new EventSource(
        `${apiUrl}/admin/stats/live?token=${token}`,
      );

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          setStats((prev: any) => ({
            ...prev,
            ...newData,
          }));
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (error) => {
        setConnectionStatus('disconnected');
        eventSource?.close();
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token]);

  return (
    <>
      {/* Connection Indicator */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-muted-foreground uppercase tracking-wider">
            {connectionStatus === 'connected'
              ? 'Live Updates Active'
              : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected (Retrying...)'}
          </span>
        </div>
      </div>

      <div className="grid flex-1 items-start gap-8">
        {/* Business Metrics Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Business Metrics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber value={stats?.totalUsers || 0} />
                <p className="text-xs text-muted-foreground mt-1">
                  Registered accounts
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
                <Globe className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber value={stats?.totalProjects || 0} />
                <p className="text-xs text-muted-foreground mt-1">
                  Active workspaces
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime MRR
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Infrastructure Health */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" /> Infrastructure Health
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Typesense Status
                </CardTitle>
                {stats?.searchStats?.typesense?.healthy ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 glow-text" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500 glow-text" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold h-10">
                  {stats?.searchStats?.typesense?.healthy
                    ? 'Operational'
                    : 'Degraded'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Search cluster health
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Indexed Documents
                </CardTitle>
                <Database className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={(
                    stats?.searchStats?.typesense?.totalDocuments || 0
                  ).toLocaleString()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total searchable records
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Resources */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> System Resources
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  CPU
                </CardTitle>
                <Activity className="h-4 w-4 text-primary opacity-50" />
              </CardHeader>
              <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="text-4xl font-bold h-10 tracking-tight">
                    {(stats?.searchStats?.workerResources?.systemCpu || 0).toFixed(1)}<span className="text-xl text-muted-foreground font-normal ml-1">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Worker Load: <span className="font-medium text-foreground">{(stats?.searchStats?.workerResources?.cpu || 0).toFixed(1)}%</span>
                  </p>
                </div>
                
                {/* Sparkline Chart */}
                <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.searchStats?.workerResourcesHistory || []} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="systemCpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  RAM
                </CardTitle>
                <Server className="h-4 w-4 text-primary opacity-50" />
              </CardHeader>
              <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="text-4xl font-bold h-10 tracking-tight">
                    {(stats?.searchStats?.workerResources?.systemMemoryPercent || 0).toFixed(1)}<span className="text-xl text-muted-foreground font-normal ml-1">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex justify-between">
                    <span>Worker: {( (stats?.searchStats?.workerResources?.memory || 0) / 1024 / 1024 ).toFixed(1)} MB</span>
                    <span>Total: {( (stats?.searchStats?.workerResources?.systemMemoryTotal || 0) / 1024 / 1024 / 1024 ).toFixed(1)} GB</span>
                  </p>
                </div>

                {/* Sparkline Chart */}
                <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.searchStats?.workerResourcesHistory || []} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="systemMemoryPercent" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  STORAGE
                </CardTitle>
                <HardDrive className="h-4 w-4 text-primary opacity-50" />
              </CardHeader>
              <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="text-4xl font-bold h-10 tracking-tight">
                    {(stats?.searchStats?.workerResources?.systemStoragePercent || 0).toFixed(1)}<span className="text-xl text-muted-foreground font-normal ml-1">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex justify-between">
                    <span>Used: {( (stats?.searchStats?.workerResources?.systemStorageUsed || 0) / 1024 / 1024 / 1024 ).toFixed(1)} GB</span>
                    <span>Total: {( (stats?.searchStats?.workerResources?.systemStorageTotal || 0) / 1024 / 1024 / 1024 ).toFixed(1)} GB</span>
                  </p>
                </div>

                {/* Sparkline Chart */}
                <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.searchStats?.workerResourcesHistory || []} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="systemStoragePercent" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorStorage)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  SWAP
                </CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-primary opacity-50" />
              </CardHeader>
              <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="text-4xl font-bold h-10 tracking-tight">
                    {(stats?.searchStats?.workerResources?.systemSwapPercent || 0).toFixed(1)}<span className="text-xl text-muted-foreground font-normal ml-1">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex justify-between">
                    <span>Used: {( (stats?.searchStats?.workerResources?.systemSwapUsed || 0) / 1024 / 1024 / 1024 ).toFixed(1)} GB</span>
                    <span>Total: {( (stats?.searchStats?.workerResources?.systemSwapTotal || 0) / 1024 / 1024 / 1024 ).toFixed(1)} GB</span>
                  </p>
                </div>

                {/* Sparkline Chart */}
                <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.searchStats?.workerResourcesHistory || []} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSwap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="systemSwapPercent" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSwap)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>



        {/* Search Analytics */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Search Analytics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Searches
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={(
                    stats?.searchStats?.analytics?.totalSearches || 0
                  ).toLocaleString()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total queries in last 24h
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Latency
                </CardTitle>
                <Server className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold h-10 flex items-end gap-1">
                  <span
                    className={
                      (stats?.searchStats?.analytics?.latency || 0) > 100
                        ? 'text-red-500'
                        : (stats?.searchStats?.analytics?.latency || 0) > 50
                          ? 'text-yellow-500'
                          : 'text-green-500'
                    }
                  >
                    {stats?.searchStats?.analytics?.latency || 0}
                  </span>
                  <span className="text-lg text-muted-foreground mb-1">ms</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Typesense query latency
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Queue Metrics */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Crawler Queue
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Jobs
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={stats?.searchStats?.queue?.active || 0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Currently processing
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Waiting Jobs
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={stats?.searchStats?.queue?.waiting || 0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pending in queue
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-500">
                  Failed Jobs
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={stats?.searchStats?.queue?.failed || 0}
                  className="text-3xl font-bold text-red-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>
            <Card className="hover-glow bg-card-glass border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-500">
                  Completed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={stats?.searchStats?.queue?.completed || 0}
                  className="text-3xl font-bold text-green-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully finished
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Tenants */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Top Tenants
          </h2>
          <Card className="hover-glow bg-card-glass border-primary/20 overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-medium">
                Projects by Indexed Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {!stats?.topTenants || stats.topTenants.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  stats.topTenants.map((tenant: any, index: number) => (
                    <div
                      key={tenant.projectId}
                      className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {tenant.projectId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {tenant.count.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Documents
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Failed Jobs Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" /> Latest Crawler
            Errors
          </h2>
          <Card className="hover-glow bg-card-glass border-red-500/20 overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-medium">
                Recent Failed Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {!stats?.failedJobs || stats.failedJobs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center justify-center py-8">
                    <CheckCircle2 className="h-8 w-8 text-green-500/50 mb-2" />
                    No failed jobs in the queue. Everything is running smoothly!
                  </div>
                ) : (
                  stats.failedJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500 ring-1 ring-inset ring-red-500/20">
                            Error
                          </span>
                          <span
                            className="text-sm font-medium truncate"
                            title={job.url || job.domain}
                          >
                            {job.url || job.domain || 'Unknown URL'}
                          </span>
                        </div>
                        <p
                          className="text-xs text-muted-foreground font-mono truncate"
                          title={job.failedReason}
                        >
                          {job.failedReason}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Project: {job.projectId} • ID: {job.id}
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={retryingJob === job.id}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full sm:w-auto"
                        >
                          {retryingJob === job.id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4 text-primary" />
                          )}
                          Retry
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
