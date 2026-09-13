'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [error, setError] = useState<string | null>(
    errorParam === 'unauthorized'
      ? 'You must be a Super Admin to access this panel.'
      : null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      const result = await loginAction(data);
      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.href = '/';
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to log in');
    }
  };

  return (
    <Card className="border-primary/20 shadow-xl bg-card">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Admin Portal
        </CardTitle>
        <CardDescription>
          Enter your super admin credentials to access the system
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit(onSubmit)}
        method="POST"
        action="#"
        onSubmitCapture={(e) => {
          if (!mounted) e.preventDefault();
        }}
      >
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@extim.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={!mounted || isSubmitting}
          >
            {!mounted
              ? 'Loading...'
              : isSubmitting
                ? 'Signing in...'
                : 'Sign in to Admin'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
