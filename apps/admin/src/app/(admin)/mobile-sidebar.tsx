'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Settings, Users, Globe, LayoutDashboard, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Projects', href: '/projects', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="sm:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b text-left flex flex-row items-center gap-2 m-0 space-y-0">
          <Shield className="h-6 w-6 text-primary" />
          <SheetTitle className="font-semibold text-lg">EXTIM Admin</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
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
        <div className="mt-auto p-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
