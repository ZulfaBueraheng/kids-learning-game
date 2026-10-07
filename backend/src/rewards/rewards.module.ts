import { Controller, Get, Global, Injectable, Module } from '@nestjs/common';
import { StudentId } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SUBJECTS } from '../curriculum/subjects.js';
import { earnedAchievements } from './rewards.engine.js';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Grants any newly earned achievements (and their XP). Returns the new ones. */
  async evaluate(studentId: string) {
    const [student, placements, stagesCompleted, perfectStages, mastered, worlds, progress, owned, items] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.prisma.assessment.count({ where: { studentId, status: 'COMPLETED' } }),
      this.prisma.gameSession.count({ where: { studentId, status: 'COMPLETED', stars: { gte: 1 } } }),
      this.prisma.gameSession.count({ where: { studentId, status: 'COMPLETED', stars: 3 } }),
      this.prisma.studentSkill.findMany({ where: { studentId, status: 'MASTERED' }, include: { skill: { include: { subject: true } } } }),
      this.prisma.world.findMany({ include: { levels: { select: { id: true } } } }),
      this.prisma.studentLevelProgress.findMany({ where: { studentId, bestStars: { gte: 1 } }, include: { level: true } }),
      this.prisma.studentAchievement.findMany({ where: { studentId }, include: { achievement: true } }),
      this.prisma.studentItem.findMany({ where: { studentId }, include: { item: true } }),
    ]);

    const cleared = new Set(progress.map((p) => p.levelId));
    const earned = earnedAchievements({
      placementCompleted: placements > 0,
      stagesCompleted,
      perfectStages,
      masteredSkills: mastered.map((m) => m.skill.code),
      xp: student.xp,
      worldsCompleted: worlds.filter((w) => w.levels.length && w.levels.every((l) => cleared.has(l.id))).length,
      bossesDefeated: progress.filter((p) => p.level.isBoss).length,
      itemsOwned: items.length,
      itemsBought: items.filter((i) => i.item.price != null).length,
      subjectsMastered: new Set(mastered.map((m) => m.skill.subject.code)).size,
      totalSubjects: SUBJECTS.length,
    });
    const ownedCodes = new Set(owned.map((o) => o.achievement.code));
    const fresh = await this.prisma.achievement.findMany({
      where: { code: { in: earned.filter((c) => !ownedCodes.has(c)) } },
    });
    if (fresh.length === 0) return [];

    await this.prisma.$transaction([
      this.prisma.studentAchievement.createMany({
        data: fresh.map((a) => ({ studentId, achievementId: a.id })),
        skipDuplicates: true,
      }),
      this.prisma.student.update({
        where: { id: studentId },
        data: {
          xp: { increment: fresh.reduce((s, a) => s + a.xpReward, 0) },
          coins: { increment: fresh.reduce((s, a) => s + a.coinReward, 0) },
        },
      }),
    ]);
    return fresh.map(({ code, name, description, emoji, xpReward, coinReward }) => ({
      code,
      name,
      description,
      emoji,
      xpReward,
      coinReward,
    }));
  }

  async list(studentId: string) {
    const [all, owned] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { code: 'asc' } }),
      this.prisma.studentAchievement.findMany({ where: { studentId } }),
    ]);
    const earnedAt = new Map(owned.map((o) => [o.achievementId, o.earnedAt]));
    return all.map(({ id, code, name, description, emoji, xpReward, coinReward }) => ({
      code,
      name,
      description,
      emoji,
      xpReward,
      coinReward,
      earnedAt: earnedAt.get(id) ?? null,
    }));
  }
}

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  list(@StudentId() studentId: string) {
    return this.rewards.list(studentId);
  }
}

@Global()
@Module({ controllers: [AchievementsController], providers: [RewardsService], exports: [RewardsService] })
export class RewardsModule {}
