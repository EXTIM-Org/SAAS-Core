'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getProductsAction } from '@/app/actions/products';
import { getProject } from '@/app/actions/projects';
import {
  getCartAction,
  addToCartAction,
  updateCartItemAction,
  removeCartItemAction,
} from '@/app/actions/cart';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CartDrawer, CartItem } from '@/components/CartDrawer';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function StorefrontPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [projectName, setProjectName] = useState('Loading...');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCartAction(projectId);
      setCartItems(data.cartItems || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [projectId]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsData, projectData] = await Promise.all([
        getProductsAction(projectId),
        getProject(projectId),
        fetchCart(),
      ]);
      setProducts(productsData);
      setProjectName(projectData.name);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load storefront');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fetchCart]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        await fetchData();
      }
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }));
      const result = await addToCartAction(projectId, productId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Added to cart');
      await fetchCart();
      setIsCartOpen(true);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const result = await updateCartItemAction(projectId, itemId, newQuantity);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await fetchCart();
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const result = await removeCartItemAction(projectId, itemId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Removed from cart');
      await fetchCart();
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const cartItemsCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {projectName} Storefront
          </h1>
          <p className="text-muted-foreground">
            Preview how your products look to customers.
          </p>
        </div>

        <Button
          onClick={() => setIsCartOpen(true)}
          className="relative"
          variant="outline"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Cart
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {cartItemsCount}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No products available.
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[3rem]">
                  {product.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-2xl font-bold">
                  ${(product.price / 100).toFixed(2)}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={addingToCart[product.id]}
                >
                  {addingToCart[product.id] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
