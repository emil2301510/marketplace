import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus } from './order.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async create(userId: string, items: { productId: string; quantity: number }[], shippingAddress: string) {
    let total = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) throw new BadRequestException(`Not enough stock for ${product.title}`);

      total += Number(product.price) * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
      // Deduct stock
      await this.productRepo.update(item.productId, { stock: product.stock - item.quantity });
    }

    const order = this.orderRepo.create({
      userId,
      total,
      shippingAddress,
      status: OrderStatus.PENDING,
      items: orderItems as OrderItem[],
    });
    const saved = await this.orderRepo.save(order);

    // Mock payment — auto-pay after creation
    await this.mockPayment(saved.id);
    return this.findById(saved.id, userId);
  }

  private async mockPayment(orderId: string) {
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await this.orderRepo.update(orderId, {
      status: OrderStatus.PAID,
      paymentId,
    });
  }

  async findById(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['items', 'items.product'],
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    await this.orderRepo.update(id, { status });
    return this.findById(id, order.userId);
  }

  async adminFindAll() {
    return this.orderRepo.find({ order: { createdAt: 'DESC' }, relations: ['items'] });
  }

  // For ML: get user purchase history
  async getUserPurchasedProductIds(userId: string): Promise<string[]> {
    const orders = await this.orderRepo.find({
      where: { userId, status: OrderStatus.PAID },
      relations: ['items'],
    });
    const ids = new Set<string>();
    orders.forEach((o) => o.items?.forEach((i) => ids.add(i.productId)));
    return Array.from(ids);
  }
}
