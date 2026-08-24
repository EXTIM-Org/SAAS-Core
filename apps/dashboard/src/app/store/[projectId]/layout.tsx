import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { getProject } from '@/app/actions/projects';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project;
  try {
    project = await getProject(projectId);
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Store Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The store you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-50">
        <Link href={`/store/${projectId}`} className="text-xl font-bold">
          {project.name}
        </Link>
        <Link
          href={`/store/${projectId}/cart`}
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors relative"
          aria-label="Shopping Cart"
        >
          <ShoppingCart className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
