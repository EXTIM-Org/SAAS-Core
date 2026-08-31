import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LiveStatsDisplay } from '@/components/admin/LiveStatsDisplay';

async function getStats(token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return null;
  }
}

export default async function MonitorDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const stats = await getStats(token);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Live metrics and infrastructure health.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2 hover-glow">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Button>
        </Link>
      </div>

      {/* Hand off to the client component for real-time SSE updates and animations */}
      <LiveStatsDisplay initialStats={stats} token={token} />
    </div>
  );
}
