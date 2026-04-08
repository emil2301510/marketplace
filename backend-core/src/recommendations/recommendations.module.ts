import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecommendationsController } from './recommendations.controller';
import { ReviewsModule } from '../reviews/reviews.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ConfigModule, ReviewsModule, OrdersModule],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
