import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { getProject } from '@/app/actions/projects';
import { LiveSearch } from '@/components/store/LiveSearch';

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
        <Link href={`/store/${projectId}`} className="text-xl font-bold shrink-0">
          {project.name}
        </Link>

        <div className="flex-1 flex justify-center max-w-2xl px-4">
          <LiveSearch projectId={projectId} />
        </div>

        <div className="flex items-center shrink-0">
          <Link
            href={`/store/${projectId}/cart`}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors relative"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
