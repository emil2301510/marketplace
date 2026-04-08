import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/roles.decorator';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import { ReviewsService } from '../reviews/reviews.service';
import { OrdersService } from '../orders/orders.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  private mlUrl: string;

  constructor(
    private config: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private reviewsService: ReviewsService,
    private ordersService: OrdersService,
  ) {
    this.mlUrl = config.get('ML_SERVICE_URL', 'http://localhost:8000');
  }

  @Get('user')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async forUser(@CurrentUser() user: any) {
    const cacheKey = `recs:user:${user.id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const res = await fetch(`${this.mlUrl}/recommendations/user/${user.id}`);
      if (!res.ok) throw new Error('ML service error');
      const data = await res.json();
      await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 1800); // 30 min cache
      return data;
    } catch {
      return { productIds: [], fallback: true };
    }
  }

  @Get('product/:id')
  async similar(@Param('id') id: string) {
    const cacheKey = `recs:product:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const res = await fetch(`${this.mlUrl}/recommendations/similar/${id}`);
      if (!res.ok) throw new Error('ML service error');
      const data = await res.json();
      await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
      return data;
    } catch {
      return { productIds: [], fallback: true };
    }
  }

  @Get('train')
  async triggerTraining() {
    // Send ratings matrix to ML service for training
    const ratings = await this.reviewsService.getAllRatings();
    try {
      await fetch(`${this.mlUrl}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings }),
      });
      return { status: 'training started' };
    } catch {
      return { status: 'ml service unavailable' };
    }
  }
}
