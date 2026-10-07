import { Global, Injectable, Module } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditAction =
  | 'ADULT_REGISTER'
  | 'PARENT_LINK_CHILD'
  | 'PARENT_UNLINK_CHILD'
  | 'PARENT_REMOVE_FROM_CLASS'
  | 'CLASS_CREATE'
  | 'CLASS_JOIN'
  | 'CLASS_REMOVE_STUDENT'
  | 'ASSIGNMENT_CREATE'
  | 'REPORT_VIEW';

/** Records who accessed or changed a child's data, for accountability. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actorUserId: string | null, action: AuditAction, studentId?: string | null, meta?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: { actorUserId, action, studentId: studentId ?? null, meta: meta as Prisma.InputJsonValue | undefined },
    });
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
