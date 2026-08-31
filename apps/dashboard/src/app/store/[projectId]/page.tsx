import Link from 'next/link';
import { getProductsAction } from '@/app/actions/products';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageOpen } from 'lucide-react';

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  let error = null;

  try {
    products = await getProductsAction(projectId);
  } catch {
    error = 'Failed to load products. Please try again later.';
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-muted py-12 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to Our Store
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Browse our latest collection of products. Discover high-quality items
          tailored for you.
        </p>
      </section>

      {/* Products Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-8">Latest Products</h2>

        {error ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center justify-center text-muted-foreground border rounded-lg border-dashed">
            <PackageOpen className="h-12 w-12 mb-4 opacity-20" />
            <p>No products are currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(
              (product: {
                id: string;
                name: string;
                description: string;
                price: number | string;
              }) => (
                <Card
                  key={product.id}
                  className="flex flex-col overflow-hidden transition-all hover:shadow-md"
                >
                  <CardHeader className="p-0 border-b">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {/* Placeholder for Product Image */}
                      <span className="text-muted-foreground/50 font-medium tracking-widest text-xs uppercase">
                        Image Placeholder
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    <h3
                      className="font-semibold text-lg line-clamp-1 mb-1"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
                      {product.description || 'No description available.'}
                    </p>
                    <p className="font-bold text-lg">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Link
                      href={`/store/${projectId}/product/${product.id}`}
                      className="w-full"
                    >
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
