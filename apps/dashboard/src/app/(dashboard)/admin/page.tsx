import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/user';
import { getAdminStatsAction } from '@/app/actions/admin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function AdminPage() {
  const user = await getCurrentUserAction();

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const stats = await getAdminStatsAction();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Global Administration Panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.totalUsers ?? '---'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
            <CardDescription>Created projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.totalProjects ?? '---'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>Platform orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.totalOrders ?? '---'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Platform revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.totalRevenue !== undefined ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue) : '---'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
