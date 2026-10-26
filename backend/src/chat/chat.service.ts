import { Injectable, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository, Between } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Conversation, ConversationType, Message, MessageType } from './entities/chat.entity';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Optional()
    private readonly notifications?: NotificationService,
  ) {}

  private get users(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  /**
   * Get conversations for a user, with last message preview.
   *
   * Batched deliberately: the previous version issued three queries per
   * conversation (other participant, last message, unread count), so a page of
   * 20 cost 60 round-trips. Now it is two queries plus a fixed number of batch
   * lookups, independent of the page size.
   */
  async listConversations(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const where = [
      { participant1Id: userId, isActive: true },
      { participant2Id: userId, isActive: true },
    ];

    const [conversations, total] = await this.conversations.findAndCount({
      where,
      order: { lastMessageAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    if (conversations.length === 0) return { data: [], total, page, limit };

    const ids = conversations.map((c) => c.id);
    const otherIds = [
      ...new Set(conversations.map((c) => c.getOtherParticipantId(userId))),
    ];

    const [otherUsers, lastMessages, unreadRows] = await Promise.all([
      this.users.find({
        where: { id: In(otherIds) },
        select: ['id', 'name', 'email'],
      }),
      // DISTINCT ON yields exactly one row per conversation: the newest message.
      this.messages
        .createQueryBuilder('m')
        .distinctOn(['m.conversationId'])
        .where('m.conversationId IN (:...ids)', { ids })
        .orderBy('m.conversationId')
        .addOrderBy('m.createdAt', 'DESC')
        .getMany(),
      this.messages
        .createQueryBuilder('m')
        .select('m.conversationId', 'conversationId')
        .addSelect('COUNT(*)::int', 'count')
        .where('m.conversationId IN (:...ids)', { ids })
        .andWhere('m.senderId != :userId', { userId })
        .andWhere('m.isRead = :isRead', { isRead: false })
        .groupBy('m.conversationId')
        .getRawMany<{ conversationId: string; count: number }>(),
    ]);

    const userById = new Map(otherUsers.map((u) => [u.id, u]));
    const lastByConversation = new Map(lastMessages.map((m) => [m.conversationId, m]));
    const unreadByConversation = new Map(
      unreadRows.map((r) => [r.conversationId, Number(r.count)]),
    );

    const enriched = conversations.map((conv) => {
      // getOtherParticipantId, not the context-free getter: otherwise the
      // preview shows the caller as the *other* participant.
      const otherId = conv.getOtherParticipantId(userId);
      const otherUser = userById.get(otherId);
      const lastMessage = lastByConversation.get(conv.id);

      return {
        id: conv.id,
        type: conv.type,
        productId: conv.productId,
        subject: conv.subject,
        isActive: conv.isActive,
        createdAt: conv.createdAt,
        lastMessageAt: conv.lastMessageAt,
        otherParticipant: otherUser
          ? { id: otherUser.id, name: otherUser.name, email: otherUser.email }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: unreadByConversation.get(conv.id) ?? 0,
      };
    });

    return { data: enriched, total, page, limit };
  }

  /**
   * Get a single conversation with messages (paginated)
   */
  async getConversation(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const conversation = await this.conversations.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check user is a participant
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not authorized to view this conversation');
    }

    const [messages, total] = await this.messages.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sender'],
    });

    const otherId = conversation.getOtherParticipantId(userId);
    const otherUser = await this.users.findOne({
      where: { id: otherId },
      select: ['id', 'name', 'email'],
    });

    return {
      conversation: {
        id: conversation.id,
        type: conversation.type,
        productId: conversation.productId,
        subject: conversation.subject,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt,
        otherParticipant: otherUser
          ? { id: otherUser.id, name: otherUser.name, email: otherUser.email }
          : null,
      },
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        sender: m.sender
          ? { id: m.sender.id, name: m.sender.name }
          : null,
        type: m.type,
        content: m.content,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        isRead: m.isRead,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Create or find existing conversation between two users
   */
  async findOrCreateConversation(
    userId: string,
    dto: CreateConversationDto,
  ) {
    const { participantId, productId, subject, type = 'buyer_seller' } = dto;

    if (participantId === userId) {
      throw new ForbiddenException('Cannot create conversation with yourself');
    }

    const otherUser = await this.users.findOne({ where: { id: participantId } });
    if (!otherUser) throw new NotFoundException('Participant not found');

    // Check if conversation already exists
    let conversation = await this.conversations
      .createQueryBuilder('conv')
      .where('conv.participant1Id = :userId AND conv.participant2Id = :participantId', {
        userId,
        participantId,
      })
      .orWhere('conv.participant1Id = :participantId AND conv.participant2Id = :userId', {
        userId,
        participantId,
      })
      .andWhere('conv.isActive = :isActive', { isActive: true })
      .andWhere(
        productId
          ? 'conv.productId = :productId'
          : 'conv.productId IS NULL',
        { productId },
      )
      .getOne();

    if (!conversation) {
      const newConv = this.conversations.create({
        type: type as ConversationType,
        participant1Id: userId,
        participant2Id: participantId,
        productId,
        subject: subject || 'New conversation',
      });
      conversation = await this.conversations.save(newConv);
    }

    return this.getConversation(conversation.id, userId);
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    const conversation = await this.conversations.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check user is a participant
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not authorized to send messages in this conversation');
    }

    if (!conversation.isActive) {
      throw new ForbiddenException('Conversation is closed');
    }

    const message = this.messages.create({
      conversationId,
      senderId: userId,
      type: dto.type || MessageType.TEXT,
      content: dto.content,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      metadata: dto.metadata,
    });

    const saved = await this.messages.save(message);

    // Update conversation last message info
    await this.conversations.update(conversationId, {
      lastMessageAt: new Date(),
      lastMessageById: userId,
    });

    // Delivery path: the recipient used to see a message only on refetch.
    // Fire-and-forget so a notification failure never fails the send.
    if (this.notifications) {
      const recipientId = conversation.getOtherParticipantId(userId);
      void this.users
        .findOne({ where: { id: userId }, select: ['id', 'name'] })
        .then((sender) =>
          this.notifications!.notifyNewMessage(recipientId, {
            senderName: sender?.name || 'Someone',
            conversationId,
            preview:
              dto.content?.trim() ||
              (dto.fileName ? `Sent you a file: ${dto.fileName}` : 'Sent you a message'),
          }),
        )
        .catch(() => undefined);
    }

    return {
      id: saved.id,
      conversationId: saved.conversationId,
      senderId: saved.senderId,
      type: saved.type,
      content: saved.content,
      fileUrl: saved.fileUrl,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
      isRead: saved.isRead,
      createdAt: saved.createdAt,
    };
  }

  /**
   * Get messages for a conversation (paginated)
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const conversation = await this.conversations.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not authorized to view messages');
    }

    const [messages, total] = await this.messages.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      messages: messages.reverse().map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        type: m.type,
        content: m.content,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        isRead: m.isRead,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversations.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Get the other participant's ID
    const otherId = conversation.getOtherParticipantId(userId);

    // Mark all unread messages from the other participant as read
    await this.messages
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true, readAt: new Date(), readById: userId })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId = :senderId', { senderId: otherId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();
  }

  /**
   * Get unread count for user — one aggregate query, not one per conversation.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversations.find({
      where: [
        { participant1Id: userId, isActive: true },
        { participant2Id: userId, isActive: true },
      ],
      select: ['id'],
    });
    if (conversations.length === 0) return 0;

    const row = await this.messages
      .createQueryBuilder('m')
      .select('COUNT(*)::int', 'count')
      .where('m.conversationId IN (:...ids)', { ids: conversations.map((c) => c.id) })
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.isRead = :isRead', { isRead: false })
      .getRawOne<{ count: number }>();

    return Number(row?.count ?? 0);
  }
}