import Link from 'next/link';
import { Shield, Settings, Users, Globe, LayoutDashboard } from 'lucide-react';

import { AdminSidebar } from './admin-sidebar';
import { MobileSidebar } from './mobile-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex h-screen bg-muted/40 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          {/* Ambient Glow Effects */}
          <div className="ambient-glow top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
          <div className="ambient-glow bottom-0 right-0 translate-x-1/3 translate-y-1/3" />

          {/* Mobile Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden">
            <MobileSidebar />
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">EXTIM Admin</span>
            </div>
          </header>

          <main className="flex-1 relative z-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
