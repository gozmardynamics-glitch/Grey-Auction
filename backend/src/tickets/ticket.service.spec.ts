import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TicketService } from './ticket.service';
import { TicketSlaService } from './ticket-sla.service';
import {
  Ticket,
  TicketCategory,
  TicketClosureReason,
  TicketSeverity,
  TicketStatus,
} from './ticket.entity';
import { EmailService } from '../common/email/email.service';

describe('TicketSlaService', () => {
  const sla = new TicketSlaService();

  it('derives severity from the category, with money and data as P1', () => {
    expect(sla.severityFor(TicketCategory.ESCROW)).toBe(TicketSeverity.P1);
    expect(sla.severityFor(TicketCategory.PAYOUTS)).toBe(TicketSeverity.P1);
    expect(sla.severityFor(TicketCategory.DATA_PROTECTION)).toBe(TicketSeverity.P1);
    expect(sla.severityFor(TicketCategory.PAYMENTS)).toBe(TicketSeverity.P2);
    expect(sla.severityFor(TicketCategory.BIDDING)).toBe(TicketSeverity.P3);
    expect(sla.severityFor(TicketCategory.OTHER)).toBe(TicketSeverity.P4);
    // Unknown input must not throw; it falls back to ordinary service.
    expect(sla.severityFor('nonsense')).toBe(TicketSeverity.P3);
  });

  it('counts in business days, skipping weekends', () => {
    // Friday 2026-10-30 + 1 business day = Monday 2026-11-02
    const friday = new Date('2026-10-30T10:00:00.000Z');
    const monday = sla.addBusinessDays(friday, 1);
    expect(monday.getUTCDay()).toBe(1);
    expect(monday.getUTCDate()).toBe(2);
  });

  it('gives P1 five business days and P2 ten to resolve', () => {
    const now = new Date('2026-10-26T09:00:00.000Z'); // Monday
    const p1 = sla.schedule(TicketSeverity.P1, now);
    const p2 = sla.schedule(TicketSeverity.P2, now);

    expect(sla.businessDaysBetween(now, p1.dueAt)).toBe(5);
    expect(sla.businessDaysBetween(now, p2.dueAt)).toBe(10);
  });

  it('reports on_track, due_soon and overdue states', () => {
    const now = new Date('2026-10-26T09:00:00.000Z');
    const open = { status: TicketStatus.OPEN, acknowledgedAt: now, firstResponseAt: null };

    expect(sla.view({ ...open, dueAt: sla.addBusinessDays(now, 6) }, now).state).toBe('on_track');
    expect(sla.view({ ...open, dueAt: sla.addBusinessDays(now, 1) }, now).state).toBe('due_soon');
    // A deadline that has already arrived counts as missed.
    const pastDue = new Date(now.getTime() - 60 * 60 * 1000);
    expect(sla.view({ ...open, dueAt: pastDue }, now).state).toBe('overdue');
    expect(sla.view({ ...open, dueAt: now }, now).state).toBe('overdue');
    expect(sla.view({ ...open, status: TicketStatus.RESOLVED, dueAt: now }, now).state).toBe('closed');
  });

  it('formats the reference the complainant is quoted', () => {
    expect(sla.reference(42, new Date('2026-10-26T09:00:00.000Z'))).toBe('TKT-2026-000042');
  });
});

describe('TicketService complaint lifecycle', () => {
  let service: TicketService;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const manager = {
    query: jest.fn(async () => []),
    getRepository: jest.fn(() => repo),
  };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };
  const emailService = { sendEmail: jest.fn(async () => undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    (repo.count as jest.Mock).mockResolvedValue(41);
    (repo.create as jest.Mock).mockImplementation((row: any) => row);
    (repo.save as jest.Mock).mockImplementation(async (row: any) => ({ id: 't1', ...row }));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        TicketSlaService,
        { provide: getRepositoryToken(Ticket), useValue: repo },
        { provide: DataSource, useValue: dataSource },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();
    service = module.get<TicketService>(TicketService);
  });

  it('classifies a new complaint, starts both clocks and emails the reference', async () => {
    const ticket: any = await service.create({
      subject: 'Payout never arrived',
      category: 'payouts',
      userId: 'u1',
      userEmail: 'seller@example.com',
    });

    expect(ticket.reference).toBe('TKT-2026-000042');
    expect(ticket.category).toBe(TicketCategory.PAYOUTS);
    // Category drives severity: money already moved is P1.
    expect(ticket.severity).toBe(TicketSeverity.P1);
    expect(ticket.acknowledgedAt).toBeTruthy();
    expect(ticket.dueAt).toBeTruthy();
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'seller@example.com', subject: expect.stringContaining('TKT-2026-000042') }),
    );
    // The acknowledgement is not allowed to break ticket creation.
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('does not let a failing email lose the complaint', async () => {
    (emailService.sendEmail as jest.Mock).mockRejectedValueOnce(new Error('smtp down'));

    await expect(
      service.create({ subject: 'Invoice query', category: 'payments', userId: 'u1', userEmail: 'b@example.com' }),
    ).resolves.toMatchObject({ category: TicketCategory.PAYMENTS });
  });

  it('starts the first-response clock only on a staff reply', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 't1',
      userId: 'u1',
      status: TicketStatus.OPEN,
      messages: [],
      firstResponseAt: null,
    });

    await service.sendMessage('t1', 'staff-1', 'We are looking into it', { staff: true });
    expect(repo.update).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ firstResponderId: 'staff-1', status: TicketStatus.IN_PROGRESS }),
    );

    jest.clearAllMocks();
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 't1', userId: 'u1', status: TicketStatus.OPEN, messages: [], firstResponseAt: null,
    });
    await service.sendMessage('t1', 'u1', 'Any news?', { staff: false });
    const patch = (repo.update as jest.Mock).mock.calls[0][1];
    expect(patch.firstResponseAt).toBeUndefined();
    expect(patch.status).toBeUndefined();
  });

  it('refuses to resolve without an outcome, or close without a reason', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 't1', messages: [], status: TicketStatus.OPEN });

    await expect(service.setStatus('t1', { status: TicketStatus.RESOLVED })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.setStatus('t1', { status: TicketStatus.CLOSED })).rejects.toThrow(
      BadRequestException,
    );

    (repo.save as jest.Mock).mockImplementation(async (row: any) => row);
    const resolved = await service.setStatus('t1', {
      status: TicketStatus.RESOLVED,
      outcome: 'upheld' as any,
      note: 'Payout re-issued',
    });
    expect(resolved.outcome).toBe('upheld');
    expect(resolved.resolutionNote).toBe('Payout re-issued');
    // Resolving counts as having responded.
    expect(resolved.firstResponseAt).toBeTruthy();
  });

  it('records a vexatious closure as a reason, not a resolution', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 't1', messages: [], status: TicketStatus.OPEN });
    (repo.save as jest.Mock).mockImplementation(async (row: any) => row);

    const closed = await service.setStatus('t1', {
      status: TicketStatus.CLOSED,
      closureReason: TicketClosureReason.VEXATIOUS,
    });
    expect(closed.closureReason).toBe(TicketClosureReason.VEXATIOUS);
    expect(closed.outcome).toBeUndefined();
  });

  it('refuses an internal review by the first responder', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 't1', messages: [], status: TicketStatus.IN_PROGRESS, firstResponderId: 'staff-1',
    });

    await expect(service.escalate('t1', { toAdminId: 'staff-1' })).rejects.toThrow(
      /someone other than the first responder/,
    );

    (repo.save as jest.Mock).mockImplementation(async (row: any) => row);
    const escalated = await service.escalate('t1', { toAdminId: 'staff-2', note: 'Customer disputes the outcome' });
    expect(escalated.escalatedToId).toBe('staff-2');
    expect(escalated.messages).toHaveLength(1);
  });
});
