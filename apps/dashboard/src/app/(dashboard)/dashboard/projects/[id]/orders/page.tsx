import { getOrdersHistoryAction } from '@/app/actions/orders';
import { getProject } from '@/app/actions/projects';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, PackageX } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export default async function OrdersHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  let orders: Order[] = [];
  let projectName = 'Loading...';

  try {
    const [ordersData, projectData] = await Promise.all([
      getOrdersHistoryAction(projectId),
      getProject(projectId),
    ]);
    orders = ordersData;
    projectName = projectData.name;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
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
          <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground">
            View past orders for {projectName}.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No orders yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven&apos;t made any purchases for this project.
          </p>
          <Link href={`/dashboard/projects/${projectId}/storefront`}>
            <Button>Visit Storefront</Button>
          </Link>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {order.orderItems.length} item(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === 'PAID'
                          ? 'default'
                          : order.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${(order.totalAmount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/projects/${projectId}/orders/${order.id}`}
                    >
                      <Button variant="ghost" size="sm" className="gap-2">
                        View Receipt
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
