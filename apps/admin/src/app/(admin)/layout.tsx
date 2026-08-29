import Link from 'next/link';
import { Shield, Settings, Users, Globe, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex h-screen bg-muted/40 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-col border-r bg-background hidden sm:flex">
          <div className="flex h-14 items-center gap-2 border-b px-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">EXTIM Admin</span>
          </div>
          <nav className="grid items-start px-4 text-sm font-medium py-4 gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/users"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Globe className="h-4 w-4" />
              Projects
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            {/* Domains monitoring will be added later */}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">EXTIM Admin</span>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
