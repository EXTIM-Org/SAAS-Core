import { getProductAction } from '@/app/actions/products';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AddToCartButton } from './add-to-cart-button';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; productId: string }>;
}) {
  const { projectId, productId } = await params;

  let product;
  try {
    product = await getProductAction(productId);
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you are looking for does not exist or you do not have
          permission to view it.
        </p>
        <Link
          href={`/store/${projectId}`}
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-8">
        <Link
          href={`/store/${projectId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Column: Image */}
        <div className="w-full bg-muted aspect-square rounded-xl flex items-center justify-center border">
          <span className="text-muted-foreground/50 font-medium tracking-widest text-sm uppercase">
            Image Placeholder
          </span>
        </div>

        {/* Right Column: Product Details */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {product.name}
          </h1>
          <p className="text-3xl font-semibold mb-6">
            ${Number(product.price).toFixed(2)}
          </p>

          <div className="prose prose-sm sm:prose-base text-muted-foreground mb-10">
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p>No description available for this product.</p>
            )}
          </div>

          <div className="mt-auto">
            <AddToCartButton projectId={projectId} productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
}
