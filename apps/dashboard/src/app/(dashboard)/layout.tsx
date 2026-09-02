import { getCurrentUserAction } from '@/app/actions/user';
import { DashboardClientLayout } from './client-layout';

import { AdminBanner } from '@/components/admin-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();

  return (
    <div className="flex flex-col min-h-screen">
      {user?.impersonatorId && <AdminBanner />}
      <div className="flex-1 flex flex-col">
        <DashboardClientLayout user={user}>{children}</DashboardClientLayout>
      </div>
    </div>
  );
}
