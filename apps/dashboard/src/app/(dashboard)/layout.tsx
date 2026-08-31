import { getCurrentUserAction } from '@/app/actions/user';
import { DashboardClientLayout } from './client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();

  return <DashboardClientLayout user={user}>{children}</DashboardClientLayout>;
}
