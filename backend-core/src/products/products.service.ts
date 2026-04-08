import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { REDIS_CLIENT } from '../common/redis/redis.module';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async findAll(query: ProductQueryDto) {
    const {
      search, category, minPrice, maxPrice,
      sortBy = 'createdAt', order = 'DESC',
      page = 1, limit = 20,
    } = query;

    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.seller', 'seller')
      .where('p.isActive = true');

    if (search) {
      // Full-text search with PostgreSQL
      qb.andWhere(
        `to_tsvector('russian', p.title || ' ' || p.description || ' ' || coalesce(p.category,'')) @@ plainto_tsquery('russian', :search)`,
        { search },
      );
    }
    if (category) qb.andWhere('p.category = :category', { category });
    if (minPrice !== undefined) qb.andWhere('p.price >= :minPrice', { minPrice });
    if (maxPrice !== undefined) qb.andWhere('p.price <= :maxPrice', { maxPrice });

    const validSorts = ['price', 'rating', 'salesCount', 'createdAt'];
    const safeSort = validSorts.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`p.${safeSort}`, order === 'ASC' ? 'ASC' : 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Product> {
    // Try cache first
    const cached = await this.redis.get(`product:${id}`);
    if (cached) return JSON.parse(cached);

    const product = await this.repo.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.redis.set(`product:${id}`, JSON.stringify(product), 'EX', 300);
    return product;
  }

  async create(dto: CreateProductDto, sellerId: string): Promise<Product> {
    const product = this.repo.create({ ...dto, sellerId });
    return this.repo.save(product);
  }

  async update(id: string, dto: UpdateProductDto, userId: string, role: string): Promise<Product> {
    const product = await this.findById(id);
    if (product.sellerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Not your product');
    }
    Object.assign(product, dto);
    const saved = await this.repo.save(product);
    await this.redis.del(`product:${id}`);
    return saved;
  }

  async delete(id: string, userId: string, role: string): Promise<void> {
    const product = await this.findById(id);
    if (product.sellerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Not your product');
    }
    await this.repo.remove(product);
    await this.redis.del(`product:${id}`);
  }

  async getCategories(): Promise<string[]> {
    const cached = await this.redis.get('categories');
    if (cached) return JSON.parse(cached);
    const rows = await this.repo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.category IS NOT NULL')
      .getRawMany();
    const cats = rows.map((r) => r.category).filter(Boolean);
    await this.redis.set('categories', JSON.stringify(cats), 'EX', 3600);
    return cats;
  }

  async getSellerProducts(sellerId: string) {
    return this.repo.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
  }

  async updateRating(productId: string, avgRating: number, count: number) {
    await this.repo.update(productId, { rating: avgRating, reviewCount: count });
    await this.redis.del(`product:${productId}`);
  }
}
