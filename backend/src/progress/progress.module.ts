import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { SUBJECTS } from '../curriculum/subjects.js';
import { publicStudent } from '../auth/auth.module.js';
import { StudentId } from '../auth/auth.guard.js';
import { CharacterService } from '../character/character.module.js';
import { LearningPathService } from '../learning-path/learning-path.module.js';
import { MasteryService } from '../mastery/mastery.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { levelInfo } from '../rewards/rewards.engine.js';
import { RewardsService } from '../rewards/rewards.module.js';
import { SkillsService } from '../skills/skills.module.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly mastery: MasteryService,
    private readonly paths: LearningPathService,
    private readonly rewards: RewardsService,
    private readonly character: CharacterService,
  ) {}

  /** Dashboard for one subject (default: the subject the child is playing now). Time, XP and rewards are shared. */
  async dashboard(studentId: string, subjectCode?: string) {
    const since = new Date(Date.now() - WEEK_MS);
    const subject = subjectCode ?? (await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } })).activeSubject;
    const [student, skills, profile, plan, achievements, weekTime, activities, placement, character, bosses] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.skills.ordered(subject),
      this.mastery.profile(studentId),
      this.paths.plan(studentId, subject),
      this.rewards.list(studentId),
      this.prisma.questionAttempt.aggregate({ where: { studentId, createdAt: { gte: since } }, _sum: { timeMs: true } }),
      this.prisma.gameSession.count({ where: { studentId, status: 'COMPLETED' } }),
      this.prisma.assessment.count({ where: { studentId, type: 'PLACEMENT', status: 'COMPLETED', subjectCode: subject } }),
      this.character.look(studentId),
      this.prisma.studentLevelProgress.count({ where: { studentId, bestStars: { gte: 1 }, level: { isBoss: true } } }),
    ]);

    const skillMap = skills.map((s) => {
      const row = profile.get(s.id);
      return {
        code: s.code,
        name: s.name,
        nameTh: s.nameTh,
        group: s.group,
        grade: s.grade,
        mastery: row?.mastery ?? 0,
        status: row?.status ?? 'NOT_STARTED',
        attempts: row?.attempts ?? 0,
      };
    });
    const overall = skillMap.reduce((sum, s) => sum + s.mastery, 0) / Math.max(skillMap.length, 1);

    return {
      subject,
      student: publicStudent(student),
      character,
      placementDone: placement > 0,
      level: levelInfo(student.xp),
      xp: student.xp,
      overallProgress: Math.round(overall * 100) / 100,
      skills: skillMap,
      strong: skillMap.filter((s) => s.status === 'MASTERED'),
      needPractice: skillMap
        .filter((s) => s.status === 'LEARNING' || s.status === 'PRACTICING')
        .sort((a, b) => a.mastery - b.mastery),
      currentPath: plan.path.slice(0, 4),
      reviews: plan.reviews,
      stats: {
        learningMinutesThisWeek: Math.round((weekTime._sum.timeMs ?? 0) / 60000),
        activitiesCompleted: activities,
        skillsMastered: skillMap.filter((s) => s.status === 'MASTERED').length,
        totalSkills: skillMap.length,
        bossesDefeated: bosses,
      },
      achievements,
    };
  }

  /** One line per subject: how far the child has come in each. */
  async subjects(studentId: string) {
    const [student, skills, profile, placements] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.skills.all(),
      this.mastery.profile(studentId),
      this.prisma.assessment.findMany({
        where: { studentId, type: 'PLACEMENT', status: 'COMPLETED' },
        select: { subjectCode: true },
      }),
    ]);
    const placed = new Set(placements.map((p) => p.subjectCode));
    return SUBJECTS.map((subject) => {
      const own = skills.filter((s) => s.subjectCode === subject.code);
      const rows = own.map((s) => profile.get(s.id));
      const progress = own.length ? rows.reduce((sum, r) => sum + (r?.mastery ?? 0), 0) / own.length : 0;
      return {
        code: subject.code,
        nameTh: subject.nameTh,
        emoji: subject.emoji,
        active: student.activeSubject === subject.code,
        placementDone: placed.has(subject.code),
        progress: Math.round(progress * 100) / 100,
        skillsMastered: rows.filter((r) => r?.status === 'MASTERED').length,
        totalSkills: own.length,
      };
    });
  }
}

@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('dashboard')
  dashboard(@StudentId() studentId: string, @Query('subject') subject?: string) {
    return this.progress.dashboard(studentId, subject || undefined);
  }

  @Get('subjects')
  subjects(@StudentId() studentId: string) {
    return this.progress.subjects(studentId);
  }
}

@Module({ controllers: [ProgressController], providers: [ProgressService], exports: [ProgressService] })
export class ProgressModule {}
