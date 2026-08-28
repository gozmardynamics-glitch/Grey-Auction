import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingAddress } from './entities/shipping-address.entity';
import { Shipment, ShipmentStatus, DeliveryMethod } from './entities/shipment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { CreateAddressDto, UpdateAddressDto, CalculateRateDto, CreateShipmentDto, UpdateShipmentStatusDto } from './dto/shipping.dto';

const CURRENCY = 'NGN';

// Region tiers: 0 = same-state pickup area, 1 = Lagos/metro, 2 = other states, 3 = international.
function regionTier(city?: string, country?: string): number {
  const c = (country || 'Nigeria').trim().toLowerCase();
  if (c !== 'nigeria' && c !== 'ng') return 3;
  const metro = (city || '').trim().toLowerCase();
  if (metro === 'lagos' || metro === 'abuja') return 1;
  return 2;
}

export interface RateQuote {
  method: DeliveryMethod;
  cost: number;
  currency: string;
  weightKg: number;
  breakdown: { label: string; amount: number }[];
}

/**
 * Deterministic, key-free shipping calculator (L5). Real carrier APIs replace
 * this table later; the interface stays the same.
 */
export function calculateShippingRate(dto: CalculateRateDto): RateQuote {
  const weight = dto.weightKg ?? 0;
  const tier = dto.method === DeliveryMethod.PICKUP ? 0 : regionTier(dto.city, dto.country);

  const breakdown: { label: string; amount: number }[] = [];
  let cost = 0;

  if (dto.method === DeliveryMethod.PICKUP) {
    breakdown.push({ label: 'Pickup at collection point', amount: 0 });
  } else {
    const base = [0, 2500, 4500, 18000][tier];
    // Free up to 20 kg, then 500 per additional 10 kg (rounded up).
    const extraKg = Math.max(0, Math.ceil((weight - 20) / 10) * 10);
    const weightFee = Math.round((extraKg / 10) * 500);
    cost = base + weightFee;
    breakdown.push({ label: 'Base delivery', amount: base });
    if (weightFee > 0) breakdown.push({ label: 'Weight surcharge', amount: weightFee });
  }

  return { method: dto.method, cost, currency: CURRENCY, weightKg: weight, breakdown };
}

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingAddress)
    private readonly addresses: Repository<ShippingAddress>,
    @InjectRepository(Shipment)
    private readonly shipments: Repository<Shipment>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
  ) {}

  /* ── Addresses ──────────────────────────────────────────────────────── */

  async listAddresses(userId: string): Promise<ShippingAddress[]> {
    return this.addresses.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<ShippingAddress> {
    if (dto.isDefault) await this.clearDefault(userId);
    const address = this.addresses.create({ ...dto, userId });
    return this.addresses.save(address);
  }

  async updateAddress(id: string, userId: string, dto: UpdateAddressDto): Promise<ShippingAddress> {
    const address = await this.ownedAddress(id, userId);
    Object.assign(address, dto);
    return this.addresses.save(address);
  }

  async setDefault(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.ownedAddress(id, userId);
    await this.clearDefault(userId);
    address.isDefault = true;
    return this.addresses.save(address);
  }

  async removeAddress(id: string, userId: string): Promise<{ success: boolean }> {
    const address = await this.ownedAddress(id, userId);
    await this.addresses.remove(address);
    return { success: true };
  }

  private async ownedAddress(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.addresses.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Not your address');
    return address;
  }

  private async clearDefault(userId: string): Promise<void> {
    await this.addresses.update({ userId, isDefault: true }, { isDefault: false });
  }

  /* ── Rates ──────────────────────────────────────────────────────────── */

  quote(dto: CalculateRateDto): RateQuote {
    return calculateShippingRate(dto);
  }

  /* ── Shipments ──────────────────────────────────────────────────────── */

  async createShipment(userId: string, dto: CreateShipmentDto): Promise<Shipment> {
    const invoice = await this.invoices.findOne({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.buyer_id !== userId && invoice.seller_id !== userId) {
      throw new ForbiddenException('Not a party to this invoice');
    }
    const quote = calculateShippingRate({ method: dto.method, weightKg: dto.cost ? undefined : 0 });
    const shipment = this.shipments.create({
      invoiceId: dto.invoiceId,
      addressId: dto.addressId ?? null,
      method: dto.method,
      carrier: dto.carrier ?? null,
      cost: dto.cost ?? quote.cost,
      status: ShipmentStatus.PENDING,
    });
    return this.shipments.save(shipment);
  }

  async getForInvoice(invoiceId: string, userId: string): Promise<Shipment[]> {
    const invoice = await this.invoices.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.buyer_id !== userId && invoice.seller_id !== userId) {
      throw new ForbiddenException('Not a party to this invoice');
    }
    return this.shipments.find({ where: { invoiceId }, order: { createdAt: 'DESC' }, take: 20 });
  }

  async updateStatus(id: string, dto: UpdateShipmentStatusDto): Promise<Shipment> {
    const shipment = await this.shipments.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const status = dto.status as ShipmentStatus;
    if (!Object.values(ShipmentStatus).includes(status)) {
      throw new BadRequestException('Invalid shipment status');
    }
    if (status === ShipmentStatus.CANCELLED && shipment.status === ShipmentStatus.DELIVERED) {
      throw new BadRequestException('Delivered shipments cannot be cancelled');
    }
    shipment.status = status;
    if (dto.trackingNumber) shipment.trackingNumber = dto.trackingNumber;
    if (status === ShipmentStatus.DELIVERED) shipment.deliveredAt = new Date();
    return this.shipments.save(shipment);
  }
}
