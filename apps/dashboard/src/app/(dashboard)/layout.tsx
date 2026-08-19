"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Home, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                S
              </div>
              <span>SaaS Core</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <div className="py-6 pr-6 lg:py-8">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
