'use client';

import { stopImpersonationAction } from '@/app/actions/stop-impersonation';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function AdminBanner() {
  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
        <ShieldAlert className="h-5 w-5" />
        <span className="text-sm font-medium">
          شما در حال مشاهده‌ی داشبورد به عنوان کاربر هستید. (Impersonation Mode)
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white dark:text-yellow-500 dark:hover:text-white"
        onClick={() => stopImpersonationAction()}
      >
        بازگشت به پنل ادمین
      </Button>
    </div>
  );
}
