import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository, Between } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Conversation, ConversationType, Message, MessageType } from './entities/chat.entity';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';

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
  ) {}

  private get users(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  /**
   * Get conversations for a user, with last message preview
   */
  async listConversations(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const conversations = await this.conversations
      .createQueryBuilder('conversation')
      .where('conversation.participant1Id = :userId', { userId })
      .orWhere('conversation.participant2Id = :userId', { userId })
      .andWhere('conversation.isActive = :isActive', { isActive: true })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total = await this.conversations
      .createQueryBuilder('conversation')
      .where('conversation.participant1Id = :userId', { userId })
      .orWhere('conversation.participant2Id = :userId', { userId })
      .andWhere('conversation.isActive = :isActive', { isActive: true })
      .getCount();

    // Hydrate with last message and other participant
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.otherParticipantId;
        const [otherUser, lastMessage] = await Promise.all([
          this.users.findOne({ where: { id: otherId }, select: ['id', 'name', 'email'] }),
          this.messages.findOne({
            where: { conversationId: conv.id },
            order: { createdAt: 'DESC' },
          }),
        ]);

        const unreadCount = await this.messages.count({
          where: { conversationId: conv.id, senderId: otherId, isRead: false },
        });

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
          unreadCount,
        };
      }),
    );

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

    // Mark as unread for the other participant
    // (handled by the read status logic)

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
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Get all conversations for user
    const conversations = await this.conversations.find({
      where: [
        { participant1Id: userId, isActive: true },
        { participant2Id: userId, isActive: true },
      ],
    });

    if (conversations.length === 0) return 0;

    const conversationIds = conversations.map((c) => c.id);

    // Count unread messages from other participants
    let total = 0;
    for (const conv of conversations) {
      const otherId = conv.getOtherParticipantId(userId);
      const count = await this.messages.count({
        where: {
          conversationId: conv.id,
          senderId: otherId,
          isRead: false,
        },
      });
      total += count;
    }

    return total;
  }
}