import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * A single "watch" on a lot. Previously the wishlist lived only in Redux, so it
 * vanished on reload and could never drive watcher counts or outbid alerts.
 * User and product are referenced by id rather than as relations: the listing
 * payload is fetched separately and we never want a cascade delete here.
 */
@Entity('watchlist_items')
@Unique('UQ_watchlist_user_product', ['userId', 'productId'])
@Index(['userId'])
@Index(['productId'])
export class WatchlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
