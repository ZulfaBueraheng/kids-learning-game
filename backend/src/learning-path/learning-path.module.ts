import { Controller, Get, Global, Injectable, Module, Query } from '@nestjs/common';
import { StudentId } from '../auth/auth.guard.js';
import { MasteryService } from '../mastery/mastery.service.js';
import { SkillsService } from '../skills/skills.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildLearningPlan, goalTargets, type StudentSkillState } from './learning-path.engine.js';

@Injectable()
export class LearningPathService {
  constructor(
    private readonly skills: SkillsService,
    private readonly mastery: MasteryService,
    private readonly prisma: PrismaService,
  ) {}

  /** The path for one subject (default: the subject the child is playing now). */
  async plan(studentId: string, subjectCode?: string) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    const subject = subjectCode ?? student.activeSubject;
    const [skills, profile] = await Promise.all([this.skills.all(subject), this.mastery.profile(studentId)]);
    const state = new Map<string, StudentSkillState>();
    for (const s of skills) {
      const row = profile.get(s.id);
      if (row) state.set(s.code, { mastery: row.mastery, nextReviewAt: row.nextReviewAt });
    }
    // The child's goal decides which skills the path aims at. A goal that has
    // nothing in this subject (e.g. word problems in English) means the whole subject.
    const targets = goalTargets(student.goal, skills, student.grade);
    const plan = buildLearningPlan(skills, state, { goals: targets.length ? targets : skills.map((s) => s.code) });
    const info = (code: string) => {
      const s = skills.find((k) => k.code === code)!;
      return { skillCode: code, name: s.name, nameTh: s.nameTh, group: s.group };
    };
    return {
      subject,
      goal: student.goal,
      current: plan.current,
      path: plan.path.map((p) => ({ ...info(p.skillCode), ...p })),
      reviews: plan.reviews.map(info),
    };
  }
}

@Controller('learning-path')
export class LearningPathController {
  constructor(private readonly paths: LearningPathService) {}

  @Get()
  get(@StudentId() studentId: string, @Query('subject') subject?: string) {
    return this.paths.plan(studentId, subject || undefined);
  }
}

@Global()
@Module({ controllers: [LearningPathController], providers: [LearningPathService], exports: [LearningPathService] })
export class LearningPathModule {}
