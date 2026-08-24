import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item-quantity.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string, projectId: string) {
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

    if (!cart) {
      return { cartItems: [] };
    }

    return cart;
  }

  private async getOrCreateCart(userId: string, projectId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          projectId,
        },
      });
    }

    return cart;
  }

  async addItem(userId: string, projectId: string, dto: AddItemDto) {
    const cart = await this.getOrCreateCart(userId, projectId);

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        projectId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this project');
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (dto.quantity || 1) },
      });
    } else {
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity || 1,
        },
      });
    }
  }

  async updateItemQuantity(
    userId: string,
    projectId: string,
    itemId: string,
    dto: UpdateItemQuantityDto,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId || item.cart.projectId !== projectId) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });
      return { success: true };
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  async removeCartItem(userId: string, projectId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId || item.cart.projectId !== projectId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }
}
