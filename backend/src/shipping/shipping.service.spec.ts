import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ShippingService, calculateShippingRate } from './shipping.service';
import { ShippingAddress } from './entities/shipping-address.entity';
import { Shipment, DeliveryMethod, ShipmentStatus } from './entities/shipment.entity';
import { Invoice } from '../invoices/invoice.entity';

describe('ShippingService', () => {
  let service: ShippingService;
  const addresses = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(), remove: jest.fn() };
  const shipments = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const invoices = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: getRepositoryToken(ShippingAddress), useValue: addresses },
        { provide: getRepositoryToken(Shipment), useValue: shipments },
        { provide: getRepositoryToken(Invoice), useValue: invoices },
      ],
    }).compile();
    service = module.get<ShippingService>(ShippingService);
  });

  describe('rate calculator', () => {
    it('quotes free pickup', () => {
      const q = calculateShippingRate({ method: DeliveryMethod.PICKUP });
      expect(q.cost).toBe(0);
    });

    it('charges the metro rate for Lagos and adds a weight surcharge', () => {
      const q = calculateShippingRate({ method: DeliveryMethod.DELIVERY, city: 'Lagos', weightKg: 25 });
      // base 2500 + 500 for the 5 kg over the free 20 kg (rounded up to a 10 kg band)
      expect(q.cost).toBe(3000);
      expect(q.breakdown).toHaveLength(2);
    });

    it('charges the international rate outside Nigeria', () => {
      const q = calculateShippingRate({ method: DeliveryMethod.DELIVERY, country: 'Ghana', weightKg: 5 });
      expect(q.cost).toBe(18000);
    });

    it('charges the inter-state rate for non-metro Nigerian cities', () => {
      const q = calculateShippingRate({ method: DeliveryMethod.DELIVERY, city: 'Enugu', weightKg: 0 });
      expect(q.cost).toBe(4500);
    });
  });

  describe('addresses', () => {
    it('clears the previous default when creating a new default', async () => {
      (addresses.create as jest.Mock).mockImplementation((x) => x);
      (addresses.save as jest.Mock).mockImplementation(async (x) => ({ id: 'a1', ...x }));
      (addresses.update as jest.Mock).mockResolvedValue({});

      const res = await service.createAddress('u1', { recipientName: 'Ada', phone: '080', line1: '1 Road', city: 'Lagos', isDefault: true } as any);

      expect(addresses.update).toHaveBeenCalledWith({ userId: 'u1', isDefault: true }, { isDefault: false });
      expect(res.isDefault).toBe(true);
    });

    it('rejects updates to an address the user does not own', async () => {
      (addresses.findOne as jest.Mock).mockResolvedValue({ id: 'a1', userId: 'other' });
      await expect(service.updateAddress('a1', 'u1', {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('rejects unknown addresses on delete', async () => {
      (addresses.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.removeAddress('nope', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('shipments', () => {
    it('rejects shipments for missing invoices', async () => {
      (invoices.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.createShipment('u1', { invoiceId: 'inv-1', method: DeliveryMethod.DELIVERY } as any)).rejects.toThrow(NotFoundException);
    });

    it('rejects shipment creation by non-parties', async () => {
      (invoices.findOne as jest.Mock).mockResolvedValue({ id: 'inv-1', buyer_id: 'b1', seller_id: 's1' });
      await expect(service.createShipment('stranger', { invoiceId: 'inv-1', method: DeliveryMethod.DELIVERY } as any)).rejects.toThrow(ForbiddenException);
    });

    it('creates a shipment with the quoted cost when none is provided', async () => {
      (invoices.findOne as jest.Mock).mockResolvedValue({ id: 'inv-1', buyer_id: 'b1', seller_id: 's1' });
      (shipments.create as jest.Mock).mockImplementation((x) => x);
      (shipments.save as jest.Mock).mockImplementation(async (x) => ({ id: 'sh1', ...x }));

      const res = await service.createShipment('b1', { invoiceId: 'inv-1', method: DeliveryMethod.PICKUP } as any);
      expect(res.status).toBe(ShipmentStatus.PENDING);
      expect(res.cost).toBe(0);
    });

    it('rejects invalid shipment statuses and cancelling a delivered shipment', async () => {
      (shipments.findOne as jest.Mock).mockResolvedValue({ id: 'sh1', status: ShipmentStatus.PENDING });
      await expect(service.updateStatus('sh1', { status: 'flying' } as any)).rejects.toThrow(BadRequestException);

      (shipments.findOne as jest.Mock).mockResolvedValue({ id: 'sh1', status: ShipmentStatus.DELIVERED });
      await expect(service.updateStatus('sh1', { status: ShipmentStatus.CANCELLED } as any)).rejects.toThrow(BadRequestException);
    });
  });
});
