import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ChatService } from './chat.service';
import { Conversation, Message, MessageType } from './entities/chat.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationService } from '../notification/notification.service';

describe('ChatService', () => {
  let service: ChatService;

  const conversations = {
    findAndCount: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const messages = { createQueryBuilder: jest.fn(), create: jest.fn(), save: jest.fn(), findOne: jest.fn(), count: jest.fn() };
  const users = { find: jest.fn(), findOne: jest.fn() };
  const notifications = { notifyNewMessage: jest.fn().mockResolvedValue(undefined) };

  const conversation = {
    id: 'conv-1',
    participant1Id: 'me',
    participant2Id: 'other',
    // getOtherParticipantId must win over the context-free getter.
    getOtherParticipantId: (uid: string) => (uid === 'me' ? 'other' : 'me'),
  };

  const dataSource = {
    getRepository: jest.fn((entity: unknown) => (entity === User ? users : conversations)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Conversation), useValue: conversations },
        { provide: getRepositoryToken(Message), useValue: messages },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  it('lists conversations without per-conversation queries', async () => {
    conversations.findAndCount.mockResolvedValue([[conversation], 1]);
    users.find.mockResolvedValue([{ id: 'other', name: 'Other', email: 'o@x.com' }]);

    const lastMessage = {
      id: 'm1', conversationId: 'conv-1', content: 'hi', type: MessageType.TEXT,
      senderId: 'other', createdAt: new Date('2026-05-01'),
    };
    // Two query builders are used: last-message (distinctOn) then unread counts.
    const lastQb = {
      distinctOn: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([lastMessage]),
    };
    const unreadQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ conversationId: 'conv-1', count: 2 }]),
    };
    messages.createQueryBuilder.mockReturnValueOnce(lastQb).mockReturnValueOnce(unreadQb);

    const result = await service.listConversations('me', 1, 20);

    expect(result.total).toBe(1);
    expect(result.data[0].otherParticipant).toEqual({ id: 'other', name: 'Other', email: 'o@x.com' });
    expect(result.data[0].lastMessage?.content).toBe('hi');
    expect(result.data[0].unreadCount).toBe(2);
    // The N+1 is gone: no per-conversation lookups.
    expect(messages.findOne).not.toHaveBeenCalled();
    expect(messages.count).not.toHaveBeenCalled();
    expect(users.findOne).not.toHaveBeenCalled();
    expect(conversations.findAndCount).toHaveBeenCalledTimes(1);
  });

  it('counts unread messages in a single aggregate query', async () => {
    conversations.find.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: 7 }),
    };
    messages.createQueryBuilder.mockReturnValue(qb);

    await expect(service.getUnreadCount('me')).resolves.toBe(7);
    expect(messages.count).not.toHaveBeenCalled();
  });

  it('notifies the other participant when a message is sent', async () => {
    conversations.findOne.mockResolvedValue({ ...conversation, isActive: true });
    messages.create.mockImplementation((x) => x);
    messages.save.mockImplementation(async (x) => ({ ...x, id: 'm9', createdAt: new Date() }));
    conversations.update.mockResolvedValue({});
    users.findOne.mockResolvedValue({ id: 'me', name: 'Sender Name' });

    await service.sendMessage('conv-1', 'me', { content: 'Hello there' } as any);
    // Notification is fire-and-forget; let its microtasks run.
    await new Promise((resolve) => setImmediate(resolve));

    expect(notifications.notifyNewMessage).toHaveBeenCalledWith(
      'other',
      expect.objectContaining({ senderName: 'Sender Name', conversationId: 'conv-1', preview: 'Hello there' }),
    );
  });
});
