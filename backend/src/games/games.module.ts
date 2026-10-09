import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { StudentId } from '../auth/auth.guard.js';
import { CharacterService } from '../character/character.module.js';
import type { GameLevel } from '../generated/prisma/client.js';
import { LearningPathService } from '../learning-path/learning-path.module.js';
import { MasteryService } from '../mastery/mastery.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AnswerDto, QuestionsService } from '../questions/questions.module.js';
import {
  BOSS_WIN_COINS,
  BOSS_WIN_XP,
  coinsForStage,
  levelInfo,
  stageBonusXp,
  starsFor,
  xpForAnswer,
} from '../rewards/rewards.engine.js';
import { RewardsService } from '../rewards/rewards.module.js';
import { SkillsService } from '../skills/skills.module.js';
import { recommendedDifficulty } from '../mastery/mastery.engine.js';
import { pickTheme, recordSignal, sanitizeInterests, topInterest } from '../personalization/interest.engine.js';
import { recommend, type RecSkill, type Recommendation } from '../personalization/recommendation.engine.js';
import type { Theme } from '../questions/themes.js';
import type { SkillInfo } from '../skills/skills.module.js';
import {
  adaptDifficulty,
  bossSkillFor,
  bossStars,
  bossState,
  frustrationGuard,
  isFastAnswer,
  startDifficulty,
  unlockedLevels,
  weakestSkill,
  type BossState,
} from './game.engine.js';

export const REVIEW_QUESTIONS = 6;

/** A review session isn't a stage; this gives the client the same shape to show. */
function reviewLevel(codes: string[], skills: SkillInfo[], difficulty: number) {
  const names = codes.map((c) => skills.find((s) => s.code === c)?.nameTh ?? c);
  return {
    id: 'review',
    name: 'ทบทวนความจำ',
    activity: 'MAGIC' as const,
    difficulty,
    questionCount: REVIEW_QUESTIONS,
    isBoss: false,
    bossEmoji: null,
    skillCode: codes[0],
    skillCodes: codes,
    skillNameTh: names.join(', '),
    stars: 0,
    unlocked: true,
    recommended: false,
    world: { code: 'REVIEW', nameTh: 'ห้องทบทวนความจำ', emoji: '🔁', theme: 'review' },
  };
}

type WorldView = Awaited<ReturnType<GamesService['worlds']>>[number];

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly questions: QuestionsService,
    private readonly mastery: MasteryService,
    private readonly rewards: RewardsService,
    private readonly paths: LearningPathService,
    private readonly character: CharacterService,
  ) {}

  /**
   * The child's worlds with unlocks and stars. By default only the subject the
   * child is playing ('ACTIVE'); 'ALL' is used when a stage id may be in any subject.
   */
  async worlds(studentId: string, scope: 'ACTIVE' | 'ALL' | string = 'ACTIVE') {
    const subjectCode =
      scope === 'ALL'
        ? undefined
        : scope === 'ACTIVE'
          ? (await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } })).activeSubject
          : scope;
    const [worlds, skills, profile, progress, plan] = await Promise.all([
      this.prisma.world.findMany({
        where: subjectCode ? { subject: { code: subjectCode } } : undefined,
        orderBy: { sortOrder: 'asc' },
        include: { levels: { orderBy: { sortOrder: 'asc' } } },
      }),
      this.skills.all(),
      this.mastery.profile(studentId),
      this.prisma.studentLevelProgress.findMany({ where: { studentId } }),
      this.paths.plan(studentId),
    ]);
    const codeOf = new Map(skills.map((s) => [s.id, s.code]));
    const nameOf = new Map(skills.map((s) => [s.code, s.nameTh]));
    const prerequisites = new Map(skills.map((s) => [s.code, s.prerequisites]));
    const mastery = new Map(skills.map((s) => [s.code, profile.get(s.id)?.mastery ?? 0]));
    const stars = new Map(progress.map((p) => [p.levelId, p.bestStars]));
    const focus = new Set([plan.current, ...plan.reviews.map((r) => r.skillCode)]);

    return worlds.map((w) => {
      const nodes = w.levels.map((l) => ({
        id: l.id,
        skillCode: codeOf.get(l.skillId)!,
        sortOrder: l.sortOrder,
        isBoss: l.isBoss,
      }));
      const open = unlockedLevels(nodes, prerequisites, mastery, stars);
      const worldSkills = [...new Set(nodes.filter((n) => !n.isBoss).map((n) => n.skillCode))];
      const levels = w.levels.map((l) => {
        const skillCode = codeOf.get(l.skillId)!;
        const best = stars.get(l.id) ?? 0;
        return {
          id: l.id,
          name: l.name,
          activity: l.activity,
          difficulty: l.difficulty,
          questionCount: l.questionCount,
          isBoss: l.isBoss,
          bossEmoji: l.bossEmoji,
          skillCode,
          skillCodes: l.isBoss ? worldSkills : [skillCode],
          skillNameTh: l.isBoss ? 'รวมทุกทักษะในโลกนี้' : nameOf.get(skillCode)!,
          stars: best,
          unlocked: open.has(l.id),
          recommended: open.has(l.id) && (l.isBoss ? best === 0 : focus.has(skillCode) && best < 3),
        };
      });
      return {
        id: w.id,
        code: w.code,
        name: w.name,
        nameTh: w.nameTh,
        emoji: w.emoji,
        theme: w.theme,
        unlocked: levels.some((l) => l.unlocked),
        stars: levels.reduce((s, l) => s + l.stars, 0),
        maxStars: levels.length * 3,
        levels,
      };
    });
  }

  async startSession(studentId: string, levelId: string) {
    const [worlds, student, profile] = await Promise.all([
      this.worlds(studentId, 'ALL'), // a stage id can be in any subject
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.mastery.profile(studentId),
    ]);
    const world = worlds.find((w) => w.levels.some((l) => l.id === levelId));
    const levelView = world?.levels.find((l) => l.id === levelId);
    if (!world || !levelView) throw new NotFoundException();
    if (!levelView.unlocked) throw new ForbiddenException('ด่านนี้ยังไม่ปลดล็อก');

    const theme = pickTheme(sanitizeInterests(student.interests));
    // A stage starts near the child's own level; bosses keep their fixed challenge.
    const skillId = (await this.skills.byCode(levelView.skillCode)).id;
    const difficulty = levelView.isBoss
      ? levelView.difficulty
      : startDifficulty(levelView.difficulty, profile.get(skillId)?.mastery ?? null);
    const firstSkill = levelView.isBoss ? bossSkillFor(levelView.skillCodes, 0) : levelView.skillCode;
    const question = await this.begin(studentId, firstSkill, difficulty, theme);
    const session = await this.prisma.gameSession.create({
      data: { studentId, levelId, theme, currentDifficulty: difficulty, currentQuestionId: question.id, xpEarned: 0 },
    });
    return {
      sessionId: session.id,
      level: { ...levelView, world: { code: world.code, nameTh: world.nameTh, emoji: world.emoji, theme: world.theme } },
      index: 0,
      total: levelView.questionCount,
      boss: levelView.isBoss ? bossState(0, 0) : null,
      theme,
      question,
    };
  }

  /** Homework from the child's teacher: practise one skill for a set number of questions. */
  async startAssignment(studentId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, classroom: { students: { some: { studentId } } } },
      include: { classroom: true },
    });
    if (!assignment) throw new NotFoundException();
    const [student, profile, skill] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.mastery.profile(studentId),
      this.skills.byCode(assignment.skillCode),
    ]);
    const difficulty = recommendedDifficulty(profile.get(skill.id)?.mastery ?? 0);
    const theme = pickTheme(sanitizeInterests(student.interests));
    const question = await this.begin(studentId, skill.code, difficulty, theme);
    const session = await this.prisma.gameSession.create({
      data: {
        studentId,
        mode: 'ASSIGNMENT',
        assignmentId,
        skillCodes: [skill.code],
        theme,
        currentDifficulty: difficulty,
        currentQuestionId: question.id,
        xpEarned: 0,
      },
    });
    return {
      sessionId: session.id,
      level: {
        ...reviewLevel([skill.code], [skill], difficulty),
        id: `assignment-${assignment.id}`,
        name: assignment.title,
        activity: 'TARGET' as const,
        questionCount: assignment.questionCount,
        world: { code: 'ASSIGNMENT', nameTh: `การบ้าน · ${assignment.classroom.name}`, emoji: '📚', theme: 'assignment' },
      },
      index: 0,
      total: assignment.questionCount,
      boss: null,
      theme,
      question,
    };
  }

  /** Spaced-practice session mixing the skills that are due (or fading). */
  async startReview(studentId: string) {
    const review = (await this.recommendations(studentId)).find((r) => r.kind === 'REVIEW');
    if (!review) throw new BadRequestException('ยังไม่มีทักษะที่ต้องทบทวนตอนนี้');
    const [student, profile, skills] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.mastery.profile(studentId),
      this.skills.all(),
    ]);
    const masteries = review.skillCodes.map((c) => profile.get(skills.find((s) => s.code === c)!.id)?.mastery ?? 0);
    const difficulty = recommendedDifficulty(masteries.reduce((s, m) => s + m, 0) / masteries.length);
    const theme = pickTheme(sanitizeInterests(student.interests));
    const question = await this.begin(studentId, review.skillCodes[0], difficulty, theme);
    const session = await this.prisma.gameSession.create({
      data: {
        studentId,
        mode: 'REVIEW',
        skillCodes: review.skillCodes,
        theme,
        currentDifficulty: difficulty,
        currentQuestionId: question.id,
        xpEarned: 0,
      },
    });
    return {
      sessionId: session.id,
      level: reviewLevel(review.skillCodes, skills, difficulty),
      index: 0,
      total: REVIEW_QUESTIONS,
      boss: null,
      theme,
      question,
    };
  }

  /** Closes any unfinished session and serves the first question. */
  private async begin(studentId: string, skillCode: string, difficulty: number, theme: Theme) {
    await this.prisma.gameSession.updateMany({
      where: { studentId, status: 'IN_PROGRESS' },
      data: { status: 'ABANDONED' },
    });
    return this.questions.serve(skillCode, difficulty, theme);
  }

  async answer(studentId: string, sessionId: string, dto: AnswerDto) {
    const session = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, studentId },
      include: { level: { include: { world: { include: { levels: true } } } } },
    });
    if (!session) throw new NotFoundException();
    if (session.status !== 'IN_PROGRESS' || session.currentQuestionId !== dto.questionId) {
      throw new BadRequestException('This question is not waiting for an answer');
    }

    const { isCorrect, correctAnswer, question } = await this.questions.recordAttempt(studentId, dto, 'PRACTICE', {
      sessionId,
    });
    const { level } = session;
    // Review and assignment sessions are not stages: they rotate through their own skill list.
    const isReview = !level;
    const reviewSkills = (session.skillCodes as string[] | null) ?? [];
    const assignment = session.assignmentId
      ? await this.prisma.assignment.findUnique({ where: { id: session.assignmentId } })
      : null;
    const base = level?.difficulty ?? session.currentDifficulty;
    const total = level?.questionCount ?? assignment?.questionCount ?? REVIEW_QUESTIONS;

    const answered = session.answered + 1;
    const correct = session.correct + (isCorrect ? 1 : 0);
    const xpEarned = (session.xpEarned ?? 0) + xpForAnswer(isCorrect, question.difficulty);
    const adapted = adaptDifficulty(session.currentDifficulty, session.streak, isCorrect, base, {
      fast: isFastAnswer(dto.timeMs, dto.hintUsed ?? false),
    });
    // Two mistakes in a row: ease off and offer the hint straight away.
    const guard = frustrationGuard(session.wrongStreak, isCorrect, base, adapted.difficulty);
    const boss = level?.isBoss ? bossState(answered, correct) : null;
    const done = boss ? boss.done : answered >= total;
    const feedback = { isCorrect, correctAnswer, hint: isCorrect ? null : question.hint, boss, support: guard.support };

    if (!done) {
      const nextSkill = isReview
        ? bossSkillFor(reviewSkills, answered)
        : level!.isBoss
          ? bossSkillFor(await this.worldSkills(level!.world.levels), answered)
          : (await this.skills.byId(level!.skillId)).code;
      const nextQuestion = await this.questions.serve(nextSkill, guard.difficulty, session.theme as Theme);
      await this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          answered,
          correct,
          xpEarned,
          currentDifficulty: guard.difficulty,
          streak: guard.support ? 0 : adapted.streak,
          wrongStreak: guard.wrongStreak,
          currentQuestionId: nextQuestion.id,
        },
      });
      return { ...feedback, index: answered, total, question: nextQuestion, summary: null };
    }

    const summary = await this.finish(studentId, session, answered, correct, xpEarned, boss);
    return { ...feedback, index: answered, total, question: null, summary };
  }

  /** Today's quests for the map: reviews, the next path skill, bosses and weak skills. */
  async recommendations(studentId: string) {
    const [worlds, plan, profile, skills, recent, student] = await Promise.all([
      this.worlds(studentId),
      this.paths.plan(studentId),
      this.mastery.profile(studentId),
      this.skills.all(),
      this.prisma.gameSession.findMany({
        where: { studentId, status: 'COMPLETED', levelId: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { levelId: true },
      }),
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
    ]);
    const recSkills = new Map<string, RecSkill>();
    for (const s of skills) {
      const row = profile.get(s.id);
      if (!row) continue;
      recSkills.set(s.code, {
        code: s.code,
        nameTh: s.nameTh,
        mastery: row.mastery,
        status: row.status,
        attempts: row.attempts,
        lastPracticedAt: row.lastPracticedAt ?? row.updatedAt,
        reviewCount: row.reviewCount,
      });
    }
    const recs: (Recommendation & { assignmentId?: string })[] = recommend({
      levels: worlds.flatMap((w) => w.levels.map((l) => ({ ...l, worldNameTh: w.nameTh, worldEmoji: w.emoji }))),
      current: plan.current,
      names: new Map(skills.map((s) => [s.code, s.nameTh])),
      reviews: plan.reviews.map((r) => r.skillCode),
      skills: recSkills,
      recentLevelIds: recent.map((r) => r.levelId!),
      topInterest: topInterest(sanitizeInterests(student.interests)),
    });

    // Homework from the teacher comes first (soonest due).
    const homework = await this.prisma.assignment.findFirst({
      where: { classroom: { students: { some: { studentId } } }, submissions: { none: { studentId } } },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      include: { classroom: true },
    });
    if (homework) {
      const due = homework.dueAt ? ` ส่งภายใน ${homework.dueAt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : '';
      recs.unshift({
        kind: 'ASSIGNMENT',
        levelId: null,
        assignmentId: homework.id,
        skillCodes: [homework.skillCode],
        title: homework.title,
        reason: `การบ้านจากห้อง ${homework.classroom.name}${due}`,
        emoji: '📚',
        score: 200,
      });
    }
    return recs.slice(0, 3);
  }

  /** Keeps each child's best attempt; the first completion time decides on-time vs late. */
  private async submitAssignment(studentId: string, assignmentId: string, correct: number, total: number, stars: number) {
    const prev = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (!prev) {
      await this.prisma.assignmentSubmission.create({ data: { assignmentId, studentId, correct, total, stars } });
      return;
    }
    const better = correct > prev.correct;
    await this.prisma.assignmentSubmission.update({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      data: { attempts: { increment: 1 }, ...(better ? { correct, total, stars } : {}) },
    });
  }

  private async worldSkills(levels: GameLevel[]): Promise<string[]> {
    const ordered = levels.filter((l) => !l.isBoss).sort((a, b) => a.sortOrder - b.sortOrder);
    const codes: string[] = [];
    for (const l of ordered) {
      const code = (await this.skills.byId(l.skillId)).code;
      if (!codes.includes(code)) codes.push(code);
    }
    return codes;
  }

  private async finish(
    studentId: string,
    session: {
      id: string;
      theme: string;
      assignmentId: string | null;
      level: (GameLevel & { world: { code: string } }) | null;
    },
    answered: number,
    correct: number,
    answerXp: number,
    boss: BossState | null,
  ) {
    const { level } = session;
    const sessionId = session.id;
    const won = boss?.won ?? false;
    const stars = boss ? bossStars(boss) : starsFor(correct, answered);
    const xpEarned = answerXp + (boss ? (won ? BOSS_WIN_XP : 0) : stageBonusXp(stars));
    const coinsEarned = coinsForStage(correct, stars) + (won ? BOSS_WIN_COINS : 0);
    const [before, worldsBefore] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.worlds(studentId, 'ALL'),
    ]);

    // A session the child did well in tells us they enjoy this theme.
    const interests =
      stars >= 2 ? recordSignal(sanitizeInterests(before.interests), session.theme as Theme) : sanitizeInterests(before.interests);

    await this.prisma.$transaction([
      this.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          answered,
          correct,
          stars,
          xpEarned,
          coinsEarned,
          status: 'COMPLETED',
          currentQuestionId: null,
          completedAt: new Date(),
        },
      }),
      this.prisma.student.update({
        where: { id: studentId },
        data: { xp: { increment: xpEarned }, coins: { increment: coinsEarned }, interests },
      }),
    ]);
    if (level) {
      const prev = await this.prisma.studentLevelProgress.findUnique({
        where: { studentId_levelId: { studentId, levelId: level.id } },
      });
      await this.prisma.studentLevelProgress.upsert({
        where: { studentId_levelId: { studentId, levelId: level.id } },
        create: { studentId, levelId: level.id, bestStars: stars, plays: 1, completedAt: stars >= 1 ? new Date() : null },
        update: {
          bestStars: Math.max(prev?.bestStars ?? 0, stars),
          plays: { increment: 1 },
          completedAt: prev?.completedAt ?? (stars >= 1 ? new Date() : null),
        },
      });
    }

    // Update mastery for every skill practised in this session (bosses and reviews mix several).
    const attempts = await this.prisma.questionAttempt.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    const skillIds = [...new Set(attempts.map((a) => a.skillId))];
    const skills = [];
    for (const skillId of skillIds) {
      const m = await this.mastery.recompute(studentId, skillId);
      const skill = await this.skills.byId(skillId);
      skills.push({ code: skill.code, nameTh: skill.nameTh, before: m.before, after: m.after, status: m.status });
    }

    if (session.assignmentId) await this.submitAssignment(studentId, session.assignmentId, correct, answered, stars);

    const reward = won && level ? await this.character.grantWorldReward(studentId, level.world.code) : null;
    const newAchievements = await this.rewards.evaluate(studentId);
    const [after, worldsAfter] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.worlds(studentId, 'ALL'),
    ]);

    return {
      stars,
      correct,
      total: answered,
      xpEarned,
      coinsEarned,
      totalXp: after.xp,
      coins: after.coins,
      level: levelInfo(after.xp),
      leveledUp: levelInfo(after.xp).level > levelInfo(before.xp).level,
      skills,
      boss:
        boss && level
          ? { ...boss, practice: won ? null : await this.practiceAfterLoss(attempts, worldsAfter, level.worldId) }
          : null,
      reward,
      unlocked: newlyUnlocked(worldsBefore, worldsAfter),
      newAchievements,
    };
  }

  /** After losing to a boss, point the child at a stage for the skill they found hardest. */
  private async practiceAfterLoss(
    attempts: { skillId: string; isCorrect: boolean }[],
    worlds: WorldView[],
    worldId: string,
  ) {
    const coded = await Promise.all(
      attempts.map(async (a) => ({ skillCode: (await this.skills.byId(a.skillId)).code, isCorrect: a.isCorrect })),
    );
    const code = weakestSkill(coded);
    const world = worlds.find((w) => w.id === worldId);
    const stage = world?.levels
      .filter((l) => !l.isBoss && l.unlocked && l.skillCode === code)
      .sort((a, b) => a.stars - b.stars)[0];
    if (!code || !stage) return null;
    return { skillCode: code, skillNameTh: stage.skillNameTh, levelId: stage.id, levelName: stage.name };
  }
}

function newlyUnlocked(before: WorldView[], after: WorldView[]) {
  const was = new Set(before.flatMap((w) => w.levels.filter((l) => l.unlocked).map((l) => l.id)));
  const worldWas = new Set(before.filter((w) => w.unlocked).map((w) => w.id));
  return {
    worlds: after.filter((w) => w.unlocked && !worldWas.has(w.id)).map((w) => ({ code: w.code, nameTh: w.nameTh, emoji: w.emoji })),
    levels: after.flatMap((w) =>
      w.levels
        .filter((l) => l.unlocked && !was.has(l.id))
        .map((l) => ({ id: l.id, name: l.name, isBoss: l.isBoss, bossEmoji: l.bossEmoji, worldNameTh: w.nameTh, worldEmoji: w.emoji })),
    ),
  };
}

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get('worlds')
  worlds(@StudentId() studentId: string) {
    return this.games.worlds(studentId);
  }

  @Get('recommendations')
  recommendations(@StudentId() studentId: string) {
    return this.games.recommendations(studentId);
  }

  @Post('review')
  review(@StudentId() studentId: string) {
    return this.games.startReview(studentId);
  }

  @Post('assignments/:id')
  assignment(@StudentId() studentId: string, @Param('id') assignmentId: string) {
    return this.games.startAssignment(studentId, assignmentId);
  }

  @Post('levels/:id/sessions')
  start(@StudentId() studentId: string, @Param('id') levelId: string) {
    return this.games.startSession(studentId, levelId);
  }

  @Post('sessions/:id/answer')
  answer(@StudentId() studentId: string, @Param('id') sessionId: string, @Body() dto: AnswerDto) {
    return this.games.answer(studentId, sessionId, dto);
  }
}

@Module({ controllers: [GamesController], providers: [GamesService] })
export class GamesModule {}
