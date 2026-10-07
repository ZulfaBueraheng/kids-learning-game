import { Global, Injectable, Module, NotFoundException } from '@nestjs/common';
import { dailyMinutes, parentInsights, timePerSkill } from '../analytics/analytics.engine.js';
import { AuditService } from '../audit/audit.module.js';
import type { AdultAuth } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressModule, ProgressService } from '../progress/progress.module.js';
import { SkillsService } from '../skills/skills.module.js';
import { subjectDef } from '../curriculum/subjects.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Child reports for grown-ups. Every read goes through `assertCanView`:
 * a parent must be linked to the child, a teacher must have the child in one
 * of their classes. Anything else looks like "not found" so nothing leaks.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
    private readonly skills: SkillsService,
    private readonly audit: AuditService,
  ) {}

  async assertCanView(adult: AdultAuth, studentId: string): Promise<void> {
    const allowed =
      adult.role === 'PARENT'
        ? await this.prisma.parentStudent.count({ where: { parentId: adult.userId, studentId } })
        : await this.prisma.classroomStudent.count({ where: { studentId, classroom: { teacherId: adult.userId } } });
    if (!allowed) throw new NotFoundException();
  }

  async forAdult(adult: AdultAuth, studentId: string, subject?: string) {
    await this.assertCanView(adult, studentId);
    await this.audit.log(adult.userId, 'REPORT_VIEW', studentId, { role: adult.role, subject });
    return this.studentReport(studentId, subject);
  }

  /** Report for one subject (default: what the child is playing now) plus a line per subject. */
  async studentReport(studentId: string, subject?: string, now = new Date()) {
    const subjectCode = subject && subjectDef(subject) ? subject : undefined;
    const [dashboard, skills, recent, lastAttempt, newlyMastered, classrooms, subjects] = await Promise.all([
      this.progress.dashboard(studentId, subjectCode),
      this.skills.all(),
      this.prisma.questionAttempt.findMany({
        where: { studentId, createdAt: { gte: new Date(now.getTime() - 14 * DAY_MS) } },
        select: { createdAt: true, timeMs: true, isCorrect: true, skillId: true },
      }),
      this.prisma.questionAttempt.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      this.prisma.studentSkill.findMany({
        where: { studentId, status: 'MASTERED', updatedAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
        select: { skillId: true },
      }),
      this.prisma.classroomStudent.findMany({
        where: { studentId },
        include: { classroom: { include: { teacher: { select: { displayName: true } } } } },
      }),
      this.progress.subjects(studentId),
    ]);
    const codeOf = new Map(skills.map((s) => [s.id, s.code]));
    const names = new Map(skills.map((s) => [s.code, s.nameTh]));
    // Daily minutes stay across all subjects (screen-time advice is about total play); skill details follow the report's subject.
    const inSubject = new Set(skills.filter((s) => s.subjectCode === dashboard.subject).map((s) => s.id));
    const week = dailyMinutes(recent.filter((a) => a.createdAt.getTime() >= now.getTime() - 7 * DAY_MS), now);
    const skillTime = timePerSkill(
      recent
        .filter((a) => inSubject.has(a.skillId))
        .map((a) => ({ skillCode: codeOf.get(a.skillId)!, timeMs: a.timeMs, isCorrect: a.isCorrect })),
      names,
    );
    const insights = parentInsights({
      nickname: dashboard.student.nickname,
      week,
      skillTime,
      recentlyMastered: newlyMastered.filter((m) => inSubject.has(m.skillId)).map((m) => names.get(codeOf.get(m.skillId)!)!),
      reviewsDue: dashboard.reviews.map((r) => r.nameTh),
      lastActiveAt: lastAttempt?.createdAt ?? null,
      now,
    });
    return {
      ...dashboard,
      subjects,
      week,
      skillTime: skillTime.slice(0, 5).map((s) => ({ ...s, minutes: Math.round(s.timeMs / 60_000) })),
      insights,
      lastActiveAt: lastAttempt?.createdAt ?? null,
      // Transparency for parents: who else can see this child's progress.
      classrooms: classrooms.map((c) => ({ id: c.classroom.id, name: c.classroom.name, teacher: c.classroom.teacher.displayName })),
    };
  }
}

@Global()
@Module({ imports: [ProgressModule], providers: [ReportsService], exports: [ReportsService] })
export class ReportsModule {}
