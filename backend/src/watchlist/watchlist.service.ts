import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { WatchlistItem } from './entities/watchlist-item.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistItem)
    private readonly watchlist: Repository<WatchlistItem>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  /** Product ids the user is watching, newest first. */
  async listIds(userId: string): Promise<string[]> {
    const rows = await this.watchlist.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => row.productId);
  }

  /**
   * Watched lots hydrated with their seller relation, in watch order. Listings
   * that have since been removed are filtered out rather than returning a hole
   * the caller has to guard against.
   */
  async listProducts(userId: string): Promise<Product[]> {
    const ids = await this.listIds(userId);
    if (ids.length === 0) return [];

    const products = await this.products.find({
      where: { id: In(ids) },
      relations: ['seller'],
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }

  async isWatching(userId: string, productId: string): Promise<boolean> {
    const count = await this.watchlist.count({ where: { userId, productId } });
    return count > 0;
  }

  /**
   * Idempotent toggle. Returns the resulting state so the client can reconcile
   * an optimistic UI update without a second round-trip.
   * Also updates the product's watchersCount column for fast grid rendering.
   */
  async toggle(
    userId: string,
    productId: string,
  ): Promise<{ watching: boolean; watchersCount: number }> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    let watching: boolean;
    const existing = await this.watchlist.findOne({
      where: { userId, productId },
    });
    if (existing) {
      await this.watchlist.remove(existing);
      watching = false;
      // Decrement watchersCount
      await this.products.decrement({ id: productId }, 'watchersCount', 1);
    } else {
      await this.watchlist.save(
        this.watchlist.create({ userId, productId }),
      );
      watching = true;
      // Increment watchersCount
      await this.products.increment({ id: productId }, 'watchersCount', 1);
    }

    const watchersCount = await this.watchlist.count({
      where: { productId },
    });
    return { watching, watchersCount };
  }

  async remove(userId: string, productId: string): Promise<{ watching: false }> {
    await this.watchlist.delete({ userId, productId });
    await this.products.decrement({ id: productId }, 'watchersCount', 1);
    return { watching: false };
  }
}
