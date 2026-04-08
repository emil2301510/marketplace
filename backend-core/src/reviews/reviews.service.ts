import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private repo: Repository<Review>,
    private productsService: ProductsService,
  ) {}

  async create(userId: string, productId: string, rating: number, comment: string) {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) throw new ConflictException('You already reviewed this product');

    const review = this.repo.create({ userId, productId, rating, comment });
    const saved = await this.repo.save(review);
    await this.recalcRating(productId);
    return saved;
  }

  async findByProduct(productId: string) {
    return this.repo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findByUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  private async recalcRating(productId: string) {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :productId', { productId })
      .getRawOne();
    await this.productsService.updateRating(
      productId,
      parseFloat(result.avg) || 0,
      parseInt(result.count) || 0,
    );
  }

  // For ML: get all ratings as matrix data
  async getAllRatings(): Promise<{ userId: string; productId: string; rating: number }[]> {
    return this.repo.find({ select: ['userId', 'productId', 'rating'] });
  }
}
