import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';

import { AuditLog, AuditAction, AuditEntityType } from './entities/audit-log.entity';
import { CreateAuditLogDto, AuditLogQueryDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  /**
   * Create an audit log entry
   */
  async log(
    userId: string,
    dto: CreateAuditLogDto,
    requestInfo?: { ipAddress?: string; userAgent?: string; correlationId?: string },
  ): Promise<AuditLog> {
    const auditLog = this.auditLogs.create({
      userId,
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      oldValues: dto.oldValues,
      newValues: dto.newValues,
      metadata: dto.metadata,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      correlationId: requestInfo?.correlationId,
    });

    return this.auditLogs.save(auditLog);
  }

  /**
   * Convenience method to log a simple action
   */
  async logAction(
    userId: string,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    changes?: { old?: Record<string, any>; new?: Record<string, any> },
    metadata?: Record<string, any>,
    requestInfo?: { ipAddress?: string; userAgent?: string; correlationId?: string },
  ): Promise<AuditLog> {
    return this.log(
      userId,
      {
        action,
        entityType,
        entityId,
        oldValues: changes?.old,
        newValues: changes?.new,
        metadata,
      },
      requestInfo,
    );
  }

  /**
   * Get paginated audit logs with filters
   */
  async findAll(
    query: AuditLogQueryDto,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const qb = this.auditLogs.createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC');

    if (query.userId) {
      qb.andWhere('audit.userId = :userId', { userId: query.userId });
    }

    if (query.action) {
      qb.andWhere('audit.action = :action', { action: query.action });
    }

    if (query.entityType) {
      qb.andWhere('audit.entityType = :entityType', { entityType: query.entityType });
    }

    if (query.entityId) {
      qb.andWhere('audit.entityId = :entityId', { entityId: query.entityId });
    }

    if (query.startDate) {
      qb.andWhere('audit.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('audit.createdAt <= :endDate', { endDate: query.endDate });
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 200);

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityHistory(
    entityType: AuditEntityType,
    entityId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const qb = this.auditLogs.createQueryBuilder('audit')
      .where('audit.entityType = :entityType', { entityType })
      .andWhere('audit.entityId = :entityId', { entityId })
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Get audit logs for a user
   */
  async getUserHistory(
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const qb = this.auditLogs.createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId })
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByEntityType: Record<string, number>;
    logsToday: number;
    logsThisWeek: number;
    logsThisMonth: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLogs,
      logsByAction,
      logsByEntityType,
      logsToday,
      logsThisWeek,
      logsThisMonth,
    ] = await Promise.all([
      this.auditLogs.count(),
      this.auditLogs
        .createQueryBuilder('audit')
        .select('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.action')
        .getRawMany(),
      this.auditLogs
        .createQueryBuilder('audit')
        .select('audit.entityType', 'entityType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.entityType')
        .getRawMany(),
      this.auditLogs.count({
        where: { createdAt: Between(todayStart, now) },
      }),
      this.auditLogs.count({
        where: { createdAt: Between(weekStart, now) },
      }),
      this.auditLogs.count({
        where: { createdAt: Between(monthStart, now) },
      }),
    ]);

    return {
      totalLogs,
      logsByAction: Object.fromEntries(logsByAction.map((r) => [r.action, Number(r.count)])),
      logsByEntityType: Object.fromEntries(logsByEntityType.map((r) => [r.entityType, Number(r.count)])),
      logsToday,
      logsThisWeek,
      logsThisMonth,
    };
  }
}