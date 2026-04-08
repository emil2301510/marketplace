import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import { CartItem, CartTotal } from './cart.interfaces';

@Injectable()
export class CartService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  private key(userId: string) {
    return `cart:${userId}`;
  }

  async getCart(userId: string): Promise<CartItem[]> {
    const data = await this.redis.get(this.key(userId));
    return data ? JSON.parse(data) : [];
  }

  async addItem(userId: string, item: CartItem): Promise<CartItem[]> {
    const cart = await this.getCart(userId);
    const existing = cart.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    await this.redis.set(this.key(userId), JSON.stringify(cart), 'EX', 86400 * 7);
    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<CartItem[]> {
    const cart = await this.getCart(userId);
    const updated = cart.filter((i) => i.productId !== productId);
    await this.redis.set(this.key(userId), JSON.stringify(updated), 'EX', 86400 * 7);
    return updated;
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem[]> {
    const cart = await this.getCart(userId);
    const item = cart.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
    if (quantity <= 0) return this.removeItem(userId, productId);
    await this.redis.set(this.key(userId), JSON.stringify(cart), 'EX', 86400 * 7);
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  async getCartTotal(userId: string): Promise<CartTotal> {
    const items = await this.getCart(userId);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { items, total };
  }
}
