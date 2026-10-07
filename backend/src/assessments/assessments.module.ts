import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { StudentId } from '../auth/auth.guard.js';
import { subjectDef } from '../curriculum/subjects.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MasteryService } from '../mastery/mastery.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AnswerDto, QuestionsService } from '../questions/questions.module.js';
import { RewardsService } from '../rewards/rewards.module.js';
import { SkillsService } from '../skills/skills.module.js';
import { pickTheme, sanitizeInterests } from '../personalization/interest.engine.js';
import {
  applyPlacementAnswer,
  createPlacementState,
  finalizePlacement,
  MAX_QUESTIONS,
  nextQuestionSpec,
  type PlacementState,
} from './placement.engine.js';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly questions: QuestionsService,
    private readonly mastery: MasteryService,
    private readonly rewards: RewardsService,
  ) {}

  /** Starts a placement assessment for the child's current subject, or resumes the one in progress. */
  async startPlacement(studentId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    const subjectCode = student.activeSubject;
    const existing = await this.prisma.assessment.findFirst({
      where: { studentId, type: 'PLACEMENT', status: 'IN_PROGRESS', subjectCode },
      orderBy: { startedAt: 'desc' },
    });
    if (existing?.currentQuestionId) {
      const state = existing.state as unknown as PlacementState;
      return {
        assessmentId: existing.id,
        question: await this.questions.findPublic(existing.currentQuestionId),
        progress: { asked: state.totalAsked, max: MAX_QUESTIONS },
      };
    }

    const skills = await this.skills.ordered(subjectCode);
    const order = skills.map((s) => s.code);
    const prerequisites = Object.fromEntries(skills.map((s) => [s.code, s.prerequisites]));
    const startCode = subjectDef(subjectCode)?.placementStart[student.grade] ?? order[0];
    const state = createPlacementState(order, Math.max(order.indexOf(startCode), 0), prerequisites);
    const spec = nextQuestionSpec(state)!;
    const question = await this.questions.serve(spec.skillCode, spec.difficulty, pickTheme(sanitizeInterests(student.interests)));
    const assessment = await this.prisma.assessment.create({
      data: { studentId, type: 'PLACEMENT', subjectCode, state: toJson(state), currentQuestionId: question.id },
    });
    return { assessmentId: assessment.id, question, progress: { asked: 0, max: MAX_QUESTIONS } };
  }

  async answer(studentId: string, assessmentId: string, dto: AnswerDto) {
    const assessment = await this.prisma.assessment.findFirst({ where: { id: assessmentId, studentId } });
    if (!assessment) throw new NotFoundException();
    if (assessment.status !== 'IN_PROGRESS' || assessment.currentQuestionId !== dto.questionId) {
      throw new BadRequestException('This question is not waiting for an answer');
    }

    const { isCorrect } = await this.questions.recordAttempt(studentId, dto, 'PLACEMENT', { assessmentId });
    const state = applyPlacementAnswer(assessment.state as unknown as PlacementState, isCorrect);
    const progress = { asked: state.totalAsked, max: MAX_QUESTIONS };
    const spec = nextQuestionSpec(state);

    if (spec) {
      const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });
      const question = await this.questions.serve(spec.skillCode, spec.difficulty, pickTheme(sanitizeInterests(student.interests)));
      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: { state: toJson(state), currentQuestionId: question.id },
      });
      return { isCorrect, progress, question, result: null };
    }

    const results = finalizePlacement(state);
    await this.mastery.applyPlacement(studentId, results);
    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        state: toJson(state),
        status: 'COMPLETED',
        currentQuestionId: null,
        result: toJson(results),
        completedAt: new Date(),
      },
    });
    const newAchievements = await this.rewards.evaluate(studentId);
    return { isCorrect, progress, question: null, result: { skills: await this.describe(results), newAchievements } };
  }

  async latest(studentId: string) {
    const { activeSubject: subjectCode } = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId } });
    const [completed, inProgress] = await Promise.all([
      this.prisma.assessment.findFirst({
        where: { studentId, type: 'PLACEMENT', status: 'COMPLETED', subjectCode },
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.assessment.count({ where: { studentId, type: 'PLACEMENT', status: 'IN_PROGRESS', subjectCode } }),
    ]);
    return {
      completedAt: completed?.completedAt ?? null,
      inProgress: inProgress > 0,
      skills: completed ? await this.describe(completed.result as unknown as ReturnType<typeof finalizePlacement>) : [],
    };
  }

  private async describe(results: ReturnType<typeof finalizePlacement>) {
    const skills = await this.skills.all();
    return results.map((r) => {
      const s = skills.find((k) => k.code === r.skillCode)!;
      return { ...r, nameTh: s.nameTh, name: s.name, group: s.group };
    });
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post('placement')
  start(@StudentId() studentId: string) {
    return this.assessments.startPlacement(studentId);
  }

  @Get('placement/latest')
  latest(@StudentId() studentId: string) {
    return this.assessments.latest(studentId);
  }

  @Post(':id/answer')
  answer(@StudentId() studentId: string, @Param('id') id: string, @Body() dto: AnswerDto) {
    return this.assessments.answer(studentId, id, dto);
  }
}

@Module({ controllers: [AssessmentsController], providers: [AssessmentsService] })
export class AssessmentsModule {}
