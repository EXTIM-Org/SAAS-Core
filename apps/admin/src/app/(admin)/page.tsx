import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Shield, Settings, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BusinessMetricsDisplay } from '@/components/admin/BusinessMetricsDisplay';

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

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const stats = await getStats(token);

  // Admin Dashboard Overview
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">

        <main className="grid flex-1 items-start gap-6 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex items-center mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard Overview
            </h1>
          </div>
          
          <BusinessMetricsDisplay 
            totalUsers={stats?.totalUsers || 0}
            totalProjects={stats?.totalProjects || 0}
            totalRevenue={stats?.totalRevenue || 0}
          />

          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <Link href="/users">
              <Card className="hover-glow bg-card-glass border-primary/20 h-full cursor-pointer transition-all hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Total Users
                  </CardTitle>
                  <Users className="h-5 w-5 text-primary glow-text" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mt-2">Manage</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    View and manage all registered users and their roles.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="hover-glow bg-card-glass border-primary/20 h-full cursor-pointer transition-all hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Global Settings
                  </CardTitle>
                  <Settings className="h-5 w-5 text-primary glow-text" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mt-2">Configure</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Adjust system-wide default settings and preferences.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/monitor">
              <Card className="hover-glow bg-card-glass border-primary/20 h-full cursor-pointer transition-all hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    System Monitor
                  </CardTitle>
                  <Activity className="h-5 w-5 text-primary glow-text" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mt-2">Monitor</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    View infrastructure health, crawler queue, and live stats.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-8">
            <Card className="bg-card-glass border-primary/10">
              <CardHeader>
                <CardTitle>Welcome, Super Admin!</CardTitle>
                <CardDescription>
                  This is the central control panel for the entire EXTIM
                  platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                  Select one of the modules above to manage users, configure
                  global application settings, or monitor the health of the
                  search cluster and crawler queues.
                </p>
                <form
                  action={async () => {
                    'use server';
                    const cookieStore = await cookies();
                    cookieStore.delete('token');
                    redirect('/login');
                  }}
                >
                  <Button
                    variant="outline"
                    type="submit"
                    className="hover-glow"
                  >
                    Sign Out
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
