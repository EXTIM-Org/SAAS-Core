import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ProcessCheckoutDto } from './dto/process-checkout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post('process')
  async processCheckout(
    @CurrentUser() user: { userId: string },
    @Body() dto: ProcessCheckoutDto,
  ) {
    return this.checkoutService.processCheckout(user.userId, dto);
  }
}
