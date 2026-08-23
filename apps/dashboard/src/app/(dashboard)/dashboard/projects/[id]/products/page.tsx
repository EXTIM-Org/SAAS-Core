'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProject } from '@/app/actions/projects';
import { getProductsAction, createProductAction } from '@/app/actions/products';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  inventoryCount: number;
  projectId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  userId: string;
};

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [inventoryCount, setInventoryCount] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectData, productsData] = await Promise.all([
          getProject(projectId),
          getProductsAction(projectId),
        ]);
        setProject(projectData);
        setProducts(productsData);
      } catch (e) {
        const err = e as Error;
        setError(err.message || 'Failed to fetch details');
      } finally {
        setInitialLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !inventoryCount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    const priceNum = parseFloat(price);
    const invNum = parseInt(inventoryCount, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Price must be a valid positive number');
      setIsCreating(false);
      return;
    }

    if (isNaN(invNum) || invNum < 0) {
      toast.error('Inventory count must be a valid positive integer');
      setIsCreating(false);
      return;
    }

    const res = await createProductAction(projectId, {
      name,
      description: description.trim() || undefined,
      price: priceNum,
      inventoryCount: invNum,
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Product created successfully');
      setProducts([...products, res.data]);
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setInventoryCount('');
    }
    setIsCreating(false);
  };

  if (initialLoading) {
    return <p>Loading products...</p>;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <p className="text-destructive">{error || 'Project not found'}</p>
        <Button
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          variant="outline"
        >
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Products for {project.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage your product catalog for this project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
          <CardDescription>
            Add a new product to your catalog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Name"
                required
                disabled={isCreating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (optional)"
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inventoryCount">Inventory Count *</Label>
                <Input
                  id="inventoryCount"
                  type="number"
                  min="0"
                  step="1"
                  value={inventoryCount}
                  onChange={(e) => setInventoryCount(e.target.value)}
                  placeholder="0"
                  required
                  disabled={isCreating}
                />
              </div>
            </div>
            <Button type="submit" disabled={isCreating} className="w-fit">
              {isCreating ? 'Creating...' : 'Create Product'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products Catalog</CardTitle>
          <CardDescription>
            List of all products under this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {products.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No products found. Create one above to get started.
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
                          {product.description || '-'}
                        </td>
                        <td className="px-4 py-3">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {product.inventoryCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
