import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Matches } from 'class-validator';
import { AuditService } from '../audit/audit.module.js';
import { hashCode } from '../auth/auth.module.js';
import { Adult, type AdultAuth } from '../auth/auth.guard.js';
import { LoginThrottle } from '../auth/password.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { levelInfo } from '../rewards/rewards.engine.js';
import { ReportsService } from '../reports/reports.module.js';

export class LinkChildDto {
  @Matches(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i)
  loginCode: string;
}

@Injectable()
export class ParentService {
  // Linking proves access with the child's code, so guard it against guessing.
  private readonly throttle = new LoginThrottle(5, 15 * 60 * 1000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly audit: AuditService,
  ) {}

  async children(parentId: string) {
    const links = await this.prisma.parentStudent.findMany({
      where: { parentId },
      include: { student: true },
      orderBy: { createdAt: 'asc' },
    });
    return links.map(({ student: s }) => ({
      id: s.id,
      nickname: s.nickname,
      avatar: s.avatar,
      grade: s.grade,
      level: levelInfo(s.xp).level,
      xp: s.xp,
    }));
  }

  async link(parentId: string, loginCode: string) {
    const key = `link:${parentId}`;
    if (this.throttle.isLocked(key)) {
      throw new HttpException('ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่', HttpStatus.TOO_MANY_REQUESTS);
    }
    const user = await this.prisma.user.findUnique({ where: { loginCodeHash: hashCode(loginCode) }, include: { student: true } });
    if (!user?.student) {
      this.throttle.fail(key);
      throw new BadRequestException('ไม่พบรหัสนักผจญภัยนี้');
    }
    this.throttle.succeed(key);
    const studentId = user.student.id;
    const exists = await this.prisma.parentStudent.count({ where: { parentId, studentId } });
    if (exists) throw new ConflictException('เชื่อมต่อกับเด็กคนนี้แล้ว');
    await this.prisma.parentStudent.create({ data: { parentId, studentId } });
    await this.audit.log(parentId, 'PARENT_LINK_CHILD', studentId);
    return this.children(parentId);
  }

  async unlink(parentId: string, studentId: string) {
    const removed = await this.prisma.parentStudent.deleteMany({ where: { parentId, studentId } });
    if (!removed.count) throw new NotFoundException();
    await this.audit.log(parentId, 'PARENT_UNLINK_CHILD', studentId);
    return this.children(parentId);
  }

  /** Parental control: take the child out of a class (the teacher then loses access). */
  async removeFromClass(adult: AdultAuth, studentId: string, classroomId: string) {
    await this.reports.assertCanView(adult, studentId);
    const removed = await this.prisma.classroomStudent.deleteMany({ where: { classroomId, studentId } });
    if (!removed.count) throw new NotFoundException();
    await this.audit.log(adult.userId, 'PARENT_REMOVE_FROM_CLASS', studentId, { classroomId });
    return this.reports.studentReport(studentId);
  }

  async activity(adult: AdultAuth, studentId: string) {
    await this.reports.assertCanView(adult, studentId);
    const logs = await this.prisma.auditLog.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { actor: { select: { displayName: true, role: true } } },
    });
    return logs.map((l) => ({
      action: l.action,
      at: l.createdAt,
      by: l.actor ? { name: l.actor.displayName, role: l.actor.role } : null,
    }));
  }
}

@Controller('parent')
export class ParentController {
  constructor(
    private readonly parents: ParentService,
    private readonly reports: ReportsService,
  ) {}

  @Get('children')
  children(@Adult('PARENT') adult: AdultAuth) {
    return this.parents.children(adult.userId);
  }

  @Post('children')
  link(@Adult('PARENT') adult: AdultAuth, @Body() dto: LinkChildDto) {
    return this.parents.link(adult.userId, dto.loginCode);
  }

  @Delete('children/:id')
  unlink(@Adult('PARENT') adult: AdultAuth, @Param('id') studentId: string) {
    return this.parents.unlink(adult.userId, studentId);
  }

  @Get('children/:id/report')
  report(@Adult('PARENT') adult: AdultAuth, @Param('id') studentId: string, @Query('subject') subject?: string) {
    return this.reports.forAdult(adult, studentId, subject);
  }

  @Get('children/:id/access-log')
  activity(@Adult('PARENT') adult: AdultAuth, @Param('id') studentId: string) {
    return this.parents.activity(adult, studentId);
  }

  @Delete('children/:id/classrooms/:classroomId')
  removeFromClass(
    @Adult('PARENT') adult: AdultAuth,
    @Param('id') studentId: string,
    @Param('classroomId') classroomId: string,
  ) {
    return this.parents.removeFromClass(adult, studentId, classroomId);
  }
}

@Module({ controllers: [ParentController], providers: [ParentService] })
export class ParentModule {}
