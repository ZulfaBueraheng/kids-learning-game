import { Global, Injectable, Module } from '@nestjs/common';
import type { PlacementSkillResult } from '../assessments/placement.engine.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SkillsService } from '../skills/skills.module.js';
import { computeMastery, MASTERY_WINDOW, nextReviewAt, statusFor } from './mastery.engine.js';

@Injectable()
export class MasteryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  /** Seeds the skill profile from a placement assessment. */
  async applyPlacement(studentId: string, results: PlacementSkillResult[]) {
    const now = new Date();
    for (const r of results) {
      const skill = await this.skills.byCode(r.skillCode);
      const status = statusFor(r.mastery, r.source === 'tested' ? 1 : 0);
      const data = {
        mastery: r.mastery,
        placementMastery: r.mastery,
        confidence: r.source === 'tested' ? 0.3 : 0.15,
        status,
        reviewCount: 0,
        nextReviewAt: status === 'MASTERED' ? nextReviewAt(now, 0) : null,
      };
      await this.prisma.studentSkill.upsert({
        where: { studentId_skillId: { studentId, skillId: skill.id } },
        create: { studentId, skillId: skill.id, ...data },
        update: data,
      });
    }
  }

  /** Recomputes one skill from practice data. Returns mastery before and after. */
  async recompute(studentId: string, skillId: string) {
    const now = new Date();
    const existing = await this.prisma.studentSkill.findUnique({
      where: { studentId_skillId: { studentId, skillId } },
    });
    const [attempts, total] = await Promise.all([
      this.prisma.questionAttempt.findMany({
        where: { studentId, skillId, context: 'PRACTICE' },
        orderBy: { createdAt: 'desc' },
        take: MASTERY_WINDOW,
      }),
      this.prisma.questionAttempt.count({ where: { studentId, skillId, context: 'PRACTICE' } }),
    ]);
    const m = computeMastery(attempts, existing?.placementMastery ?? null);
    const status = statusFor(m.mastery, total);

    // Spaced practice: first mastery schedules a review; practising after the
    // review date counts as a completed review and pushes the next one further out.
    let reviewCount = existing?.reviewCount ?? 0;
    let review = existing?.nextReviewAt ?? null;
    if (status === 'MASTERED') {
      if (existing?.status !== 'MASTERED' || !review) {
        reviewCount = 0;
        review = nextReviewAt(now, 0);
      } else if (review.getTime() <= now.getTime()) {
        reviewCount += 1;
        review = nextReviewAt(now, reviewCount);
      }
    }

    const data = {
      mastery: m.mastery,
      accuracy: m.accuracy,
      attempts: total,
      confidence: m.confidence,
      status,
      reviewCount,
      nextReviewAt: review,
      lastPracticedAt: now,
    };
    await this.prisma.studentSkill.upsert({
      where: { studentId_skillId: { studentId, skillId } },
      create: { studentId, skillId, ...data },
      update: data,
    });
    return { before: existing?.mastery ?? 0, after: m.mastery, status, breakdown: m };
  }

  async profile(studentId: string) {
    const rows = await this.prisma.studentSkill.findMany({ where: { studentId } });
    return new Map(rows.map((r) => [r.skillId, r]));
  }
}

@Global()
@Module({ providers: [MasteryService], exports: [MasteryService] })
export class MasteryModule {}
