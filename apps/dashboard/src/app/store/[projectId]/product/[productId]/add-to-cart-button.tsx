'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addToCartAction } from '@/app/actions/cart';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  projectId: string;
  productId: string;
}

export function AddToCartButton({ projectId, productId }: AddToCartButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAddToCart = async () => {
    setIsPending(true);
    try {
      const result = await addToCartAction(projectId, productId, 1);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Added to cart successfully');
      }
    } catch {
      toast.error('Failed to add to cart. Please ensure you are logged in or try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full sm:w-auto font-semibold text-lg h-14 px-8"
      onClick={handleAddToCart}
      disabled={isPending}
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {isPending ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
