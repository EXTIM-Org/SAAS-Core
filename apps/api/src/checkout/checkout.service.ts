import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessCheckoutDto } from './dto/process-checkout.dto';
import { OrderStatus } from '@saas/database';
import { EmailService } from '../notifications/email/email.service';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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

    // Fire and forget email sending
    this.sendInvoiceEmailSafely(userId, order, cart.cartItems);

    return order;
  }

  private async sendInvoiceEmailSafely(userId: string, order: any, cartItems: any[]) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User not found for invoice email (userId: ${userId})`);
        return;
      }

      const emailOrderItems = cartItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      await this.emailService.sendOrderInvoiceEmail(
        user.email,
        order,
        emailOrderItems,
      );
    } catch (error) {
      this.logger.error('Failed to send invoice email after checkout', error);
    }
  }
}
