import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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

  it('unsubscribes an email', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 's1', email: 'a@b.com', status: SubscriptionStatus.CONFIRMED });
    (repo.save as jest.Mock).mockImplementation(async (s: any) => s);

    const res = await service.unsubscribe('a@b.com');

    expect(res).toEqual({ success: true });
  });
});
