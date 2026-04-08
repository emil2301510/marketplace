import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CartItem, CartTotal } from './cart.interfaces';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/roles.decorator';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: any): Promise<CartTotal> {
    return this.cartService.getCartTotal(user.id);
  }

  @Post('add')
  addItem(@CurrentUser() user: any, @Body() item: CartItem): Promise<CartItem[]> {
    return this.cartService.addItem(user.id, item);
  }

  @Patch(':productId')
  updateQty(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ): Promise<CartItem[]> {
    return this.cartService.updateQuantity(user.id, productId, quantity);
  }

  @Delete(':productId')
  removeItem(@CurrentUser() user: any, @Param('productId') productId: string): Promise<CartItem[]> {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  clearCart(@CurrentUser() user: any): Promise<void> {
    return this.cartService.clearCart(user.id);
  }
}
