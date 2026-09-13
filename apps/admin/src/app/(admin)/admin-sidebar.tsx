'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Settings, Users, Globe, LayoutDashboard, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction } from '@/app/actions/auth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Projects', href: '/projects', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AdminSidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  return (
    <aside className="w-64 flex-col border-r bg-background hidden sm:flex z-20 relative">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-semibold">EXTIM Admin</span>
      </div>
      <nav className="flex flex-col gap-2 relative z-10 px-4 py-4">
        {navigation.map((item) => {
          // In admin, we have root '/' and other paths.
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_1rem_-0.25rem_var(--color-primary)]'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col border-t border-border/50">
        {userEmail && (
          <div className="px-6 py-3 text-xs text-muted-foreground truncate border-b border-border/50" title={userEmail}>
            Logged in as:<br/>
            <span className="font-medium text-foreground">{userEmail}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-red-500 transition-all duration-300 w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
