import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderStatus } from './order.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/roles.decorator';
import { IsArray, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(1) @Type(() => Number) quantity: number;
}

class CreateOrderDto {
  @IsArray() items: OrderItemDto[];
  @IsOptional() @IsString() shippingAddress?: string;
}

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(user.id, dto.items, dto.shippingAddress || '');
  }

  @Get()
  findMy(@CurrentUser() user: any) {
    return this.ordersService.findByUser(user.id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminAll() {
    return this.ordersService.adminFindAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findById(id, user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'seller')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }
}
