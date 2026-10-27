import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { EmailSubscription, SubscriptionStatus } from './subscription.entity';
import { EmailService } from '../common/email/email.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  const repo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const emailService = { sendEmail: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.BREVO_API_KEY = '';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(EmailSubscription), useValue: repo },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('creates a pending subscription and sends the opt-in email', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockReturnValue({ id: 's1', email: 'a@b.com', token: 'tok', status: SubscriptionStatus.PENDING });
    (repo.save as jest.Mock).mockImplementation(async (s: any) => s);
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    const res = await service.subscribe('a@b.com');

    expect(res.status).toBe(SubscriptionStatus.PENDING);
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@b.com', subject: expect.stringContaining('Confirm') }),
    );
  });

  it('confirms a subscription by token and marks it confirmed', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 's1', email: 'a@b.com', token: 'tok', status: SubscriptionStatus.PENDING });
    (repo.save as jest.Mock).mockImplementation(async (s: any) => s);

    const res = await service.confirm('tok');

    expect(res.status).toBe(SubscriptionStatus.CONFIRMED);
  });

  it('rejects a confirmation link with no token as a bad request, not a crash', async () => {
    // The opt-in link is opened by hand or by a mail scanner; a missing token
    // used to reach findOne({ token: undefined }) and answer 500.
    await expect(service.confirm(undefined as unknown as string)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('rejects an unknown confirmation token with a 4xx', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.confirm('nope')).rejects.toThrow(BadRequestException);
  });

  it('unsubscribes an email', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 's1', email: 'a@b.com', status: SubscriptionStatus.CONFIRMED });
    (repo.save as jest.Mock).mockImplementation(async (s: any) => s);

    const res = await service.unsubscribe('a@b.com');

    expect(res).toEqual({ success: true });
  });
});
