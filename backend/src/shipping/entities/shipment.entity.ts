import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum DeliveryMethod {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

/**
 * Shipment (L5 shipping): a delivery/pickup tied to an invoice.
 */
@Entity('shipments')
@Index(['invoiceId'])
@Index(['status'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'uuid', nullable: true })
  addressId: string;

  @Column({ type: 'enum', enum: DeliveryMethod, default: DeliveryMethod.DELIVERY })
  method: DeliveryMethod;

  @Column({ type: 'varchar', length: 60, nullable: true })
  carrier: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ type: 'varchar', length: 80, nullable: true })
  trackingNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDeliveryAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
