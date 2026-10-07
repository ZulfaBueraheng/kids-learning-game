import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { assignmentState, classWeakSkills, dailyMinutes, skillCell, type Cell } from '../analytics/analytics.engine.js';
import { AuditService } from '../audit/audit.module.js';
import { Adult, StudentId, type AdultAuth } from '../auth/auth.guard.js';
import { Grade } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportsService } from '../reports/reports.module.js';
import { SkillsService } from '../skills/skills.module.js';
import { randomInt } from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const DAY_MS = 24 * 60 * 60 * 1000;

export class CreateClassroomDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsOptional()
  @IsIn(Object.values(Grade))
  grade?: Grade;
}

export class CreateAssignmentDto {
  @IsString()
  skillCode: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  title?: string;

  @IsInt()
  @Min(3)
  @Max(20)
  questionCount: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}

export class JoinClassroomDto {
  @Matches(/^[A-Z0-9]{6}$/i)
  joinCode: string;
}

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly reports: ReportsService,
    private readonly audit: AuditService,
  ) {}

  private async ownClassroom(teacherId: string, classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({ where: { id: classroomId, teacherId } });
    if (!classroom) throw new NotFoundException();
    return classroom;
  }

  async list(teacherId: string) {
    const rows = await this.prisma.classroom.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { students: true, assignments: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      joinCode: c.joinCode,
      students: c._count.students,
      assignments: c._count.assignments,
    }));
  }

  async create(teacherId: string, dto: CreateClassroomDto) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const joinCode = Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      if (await this.prisma.classroom.count({ where: { joinCode } })) continue;
      const c = await this.prisma.classroom.create({ data: { teacherId, name: dto.name.trim(), grade: dto.grade, joinCode } });
      await this.audit.log(teacherId, 'CLASS_CREATE', null, { classroomId: c.id });
      return { id: c.id, name: c.name, grade: c.grade, joinCode: c.joinCode, students: 0, assignments: 0 };
    }
    throw new BadRequestException('สร้างรหัสห้องไม่สำเร็จ ลองใหม่อีกครั้ง');
  }

  /** Class overview: roster, skill map (✓ △ ✗ ·), weak skills, assignments. */
  async overview(teacherId: string, classroomId: string, now = new Date()) {
    const classroom = await this.ownClassroom(teacherId, classroomId);
    const [members, skills, assignments] = await Promise.all([
      this.prisma.classroomStudent.findMany({
        where: { classroomId },
        include: { student: { include: { skills: true } } },
        orderBy: { joinedAt: 'asc' },
      }),
      this.skills.ordered(),
      this.prisma.assignment.findMany({ where: { classroomId }, include: { submissions: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    const ids = members.map((m) => m.studentId);
    const attempts = ids.length
      ? await this.prisma.questionAttempt.findMany({
          where: { studentId: { in: ids }, createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
          select: { studentId: true, createdAt: true, timeMs: true },
        })
      : [];
    const codeOf = new Map(skills.map((s) => [s.id, s.code]));
    const names = new Map(skills.map((s) => [s.code, s.nameTh]));

    const rows = members.flatMap((m) =>
      m.student.skills.map((ss) => ({
        studentId: m.studentId,
        skillCode: codeOf.get(ss.skillId)!,
        mastery: ss.mastery,
        attempts: ss.attempts,
        status: ss.status,
      })),
    );
    // Only show columns someone in the class has started, in curriculum order.
    const started = new Set(rows.filter((r) => skillCell(r.mastery, r.attempts, r.status) !== '·').map((r) => r.skillCode));
    const columns = skills.filter((s) => started.has(s.code)).map((s) => ({ code: s.code, nameTh: s.nameTh, group: s.group }));

    const students = members.map((m) => {
      const own = rows.filter((r) => r.studentId === m.studentId);
      const cells: Record<string, Cell> = {};
      for (const c of columns) {
        const r = own.find((o) => o.skillCode === c.code);
        cells[c.code] = r ? skillCell(r.mastery, r.attempts, r.status) : '·';
      }
      const mine = attempts.filter((a) => a.studentId === m.studentId);
      return {
        id: m.studentId,
        nickname: m.student.nickname,
        avatar: m.student.avatar,
        overall: own.length ? Math.round((own.reduce((s, r) => s + r.mastery, 0) / skills.length) * 100) / 100 : 0,
        minutesThisWeek: dailyMinutes(mine, now).reduce((s, d) => s + d.minutes, 0),
        lastActiveAt: mine.reduce<Date | null>((latest, a) => (!latest || a.createdAt > latest ? a.createdAt : latest), null),
        cells,
      };
    });

    return {
      classroom: { id: classroom.id, name: classroom.name, grade: classroom.grade, joinCode: classroom.joinCode },
      columns,
      students,
      weakSkills: classWeakSkills(rows, names),
      assignments: assignments.map((a) => {
        const results = members.map((m) => {
          const sub = a.submissions.find((s) => s.studentId === m.studentId);
          return {
            studentId: m.studentId,
            nickname: m.student.nickname,
            state: assignmentState(a.dueAt, sub?.completedAt ?? null, now),
            correct: sub?.correct ?? null,
            total: sub?.total ?? null,
            stars: sub?.stars ?? null,
          };
        });
        const count = (s: string) => results.filter((r) => r.state === s).length;
        return {
          id: a.id,
          title: a.title,
          skillCode: a.skillCode,
          skillNameTh: names.get(a.skillCode) ?? a.skillCode,
          questionCount: a.questionCount,
          dueAt: a.dueAt,
          createdAt: a.createdAt,
          counts: { done: count('DONE'), late: count('LATE'), pending: count('PENDING'), overdue: count('OVERDUE') },
          results,
        };
      }),
    };
  }

  async assign(teacherId: string, classroomId: string, dto: CreateAssignmentDto) {
    await this.ownClassroom(teacherId, classroomId);
    const skill = (await this.skills.all()).find((s) => s.code === dto.skillCode);
    if (!skill) throw new BadRequestException('ไม่พบทักษะนี้');
    const a = await this.prisma.assignment.create({
      data: {
        classroomId,
        skillCode: skill.code,
        title: dto.title?.trim() || `ฝึก${skill.nameTh}`,
        questionCount: dto.questionCount,
        dueAt: dto.dueAt ?? null,
      },
    });
    await this.audit.log(teacherId, 'ASSIGNMENT_CREATE', null, { classroomId, assignmentId: a.id, skillCode: skill.code });
    return this.overview(teacherId, classroomId);
  }

  async unassign(teacherId: string, classroomId: string, assignmentId: string) {
    await this.ownClassroom(teacherId, classroomId);
    const removed = await this.prisma.assignment.deleteMany({ where: { id: assignmentId, classroomId } });
    if (!removed.count) throw new NotFoundException();
    return this.overview(teacherId, classroomId);
  }

  async removeStudent(teacherId: string, classroomId: string, studentId: string) {
    await this.ownClassroom(teacherId, classroomId);
    const removed = await this.prisma.classroomStudent.deleteMany({ where: { classroomId, studentId } });
    if (!removed.count) throw new NotFoundException();
    await this.audit.log(teacherId, 'CLASS_REMOVE_STUDENT', studentId, { classroomId });
    return this.overview(teacherId, classroomId);
  }

  async studentReport(adult: AdultAuth, classroomId: string, studentId: string, subject?: string) {
    await this.ownClassroom(adult.userId, classroomId);
    const member = await this.prisma.classroomStudent.count({ where: { classroomId, studentId } });
    if (!member) throw new NotFoundException();
    return this.reports.forAdult(adult, studentId, subject);
  }

  // ───────────── Student side ─────────────

  async join(studentId: string, joinCode: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: { teacher: { select: { displayName: true } } },
    });
    if (!classroom) throw new BadRequestException('ไม่พบห้องเรียนนี้ ลองตรวจรหัสอีกครั้งนะ');
    await this.prisma.classroomStudent.upsert({
      where: { classroomId_studentId: { classroomId: classroom.id, studentId } },
      create: { classroomId: classroom.id, studentId },
      update: {},
    });
    await this.audit.log(null, 'CLASS_JOIN', studentId, { classroomId: classroom.id });
    return this.myClassrooms(studentId);
  }

  async myClassrooms(studentId: string) {
    const rows = await this.prisma.classroomStudent.findMany({
      where: { studentId },
      include: { classroom: { include: { teacher: { select: { displayName: true } } } } },
    });
    return rows.map((r) => ({ id: r.classroom.id, name: r.classroom.name, teacher: r.classroom.teacher.displayName }));
  }

  /** Assignments from all the child's classes, unfinished first. */
  async myAssignments(studentId: string, now = new Date()) {
    const [assignments, skills] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { classroom: { students: { some: { studentId } } } },
        include: { classroom: true, submissions: { where: { studentId } } },
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      }),
      this.skills.all(),
    ]);
    const names = new Map(skills.map((s) => [s.code, s.nameTh]));
    return assignments
      .map((a) => {
        const sub = a.submissions[0];
        return {
          id: a.id,
          title: a.title,
          skillCode: a.skillCode,
          skillNameTh: names.get(a.skillCode) ?? a.skillCode,
          questionCount: a.questionCount,
          dueAt: a.dueAt,
          classroomName: a.classroom.name,
          state: assignmentState(a.dueAt, sub?.completedAt ?? null, now),
          best: sub ? { correct: sub.correct, total: sub.total, stars: sub.stars } : null,
        };
      })
      .sort((x, y) => Number(x.state === 'DONE' || x.state === 'LATE') - Number(y.state === 'DONE' || y.state === 'LATE'));
  }
}

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teachers: TeacherService) {}

  @Get('classrooms')
  list(@Adult('TEACHER') t: AdultAuth) {
    return this.teachers.list(t.userId);
  }

  @Post('classrooms')
  create(@Adult('TEACHER') t: AdultAuth, @Body() dto: CreateClassroomDto) {
    return this.teachers.create(t.userId, dto);
  }

  @Get('classrooms/:id')
  overview(@Adult('TEACHER') t: AdultAuth, @Param('id') id: string) {
    return this.teachers.overview(t.userId, id);
  }

  @Post('classrooms/:id/assignments')
  assign(@Adult('TEACHER') t: AdultAuth, @Param('id') id: string, @Body() dto: CreateAssignmentDto) {
    return this.teachers.assign(t.userId, id, dto);
  }

  @Delete('classrooms/:id/assignments/:assignmentId')
  unassign(@Adult('TEACHER') t: AdultAuth, @Param('id') id: string, @Param('assignmentId') assignmentId: string) {
    return this.teachers.unassign(t.userId, id, assignmentId);
  }

  @Delete('classrooms/:id/students/:studentId')
  removeStudent(@Adult('TEACHER') t: AdultAuth, @Param('id') id: string, @Param('studentId') studentId: string) {
    return this.teachers.removeStudent(t.userId, id, studentId);
  }

  @Get('classrooms/:id/students/:studentId/report')
  report(
    @Adult('TEACHER') t: AdultAuth,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Query('subject') subject?: string,
  ) {
    return this.teachers.studentReport(t, id, studentId, subject);
  }
}

@Controller('students/me')
export class StudentClassroomsController {
  constructor(private readonly teachers: TeacherService) {}

  @Get('classrooms')
  classrooms(@StudentId() studentId: string) {
    return this.teachers.myClassrooms(studentId);
  }

  @Post('classrooms')
  join(@StudentId() studentId: string, @Body() dto: JoinClassroomDto) {
    return this.teachers.join(studentId, dto.joinCode);
  }

  @Get('assignments')
  assignments(@StudentId() studentId: string) {
    return this.teachers.myAssignments(studentId);
  }
}

@Module({
  controllers: [TeacherController, StudentClassroomsController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
