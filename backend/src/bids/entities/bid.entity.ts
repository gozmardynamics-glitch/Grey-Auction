import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column()
  productId: string;

  @ManyToOne(() => Room, { nullable: true })
  room: Room;

  @Column({ nullable: true })
  roomId: string;

  @ManyToOne(() => User)
  bidder: User;

  @Column()
  bidderId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  /** Maximum the bidder is willing to go (proxy/auto-bid ceiling). */
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  maxBid: number | null;

  @Column({ default: false })
  isAutoBid: boolean;

  @Column({ default: false })
  isWinningBid: boolean;

  @Column({ nullable: true })
  accountingJournalId: string;

  @CreateDateColumn()
  createdAt: Date;
}
