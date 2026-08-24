import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessCheckoutDto } from './dto/process-checkout.dto';
import { OrderStatus } from '@saas/database';

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async processCheckout(userId: string, dto: ProcessCheckoutDto) {
    const { projectId } = dto;

    const cart = await this.prisma.cart.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let totalAmount = 0;
    const orderItemsData = cart.cartItems.map((item) => {
      const price = item.product.price;
      totalAmount += price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: price,
      };
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          projectId,
          totalAmount,
          status: OrderStatus.PENDING,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return createdOrder;
    });

    return order;
  }
}
