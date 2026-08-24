import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item-quantity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserPayload } from '@saas/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the user cart for a specific project' })
  getCart(
    @CurrentUser() user: UserPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.cartService.getCart(user.userId, projectId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item to the cart' })
  addItem(
    @CurrentUser() user: UserPayload,
    @Param('projectId') projectId: string,
    @Body() addItemDto: AddItemDto,
  ) {
    return this.cartService.addItem(user.userId, projectId, addItemDto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update an item quantity in the cart' })
  updateItemQuantity(
    @CurrentUser() user: UserPayload,
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Body() updateItemQuantityDto: UpdateItemQuantityDto,
  ) {
    return this.cartService.updateItemQuantity(
      user.userId,
      projectId,
      itemId,
      updateItemQuantityDto,
    );
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeCartItem(
    @CurrentUser() user: UserPayload,
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeCartItem(user.userId, projectId, itemId);
  }
}
