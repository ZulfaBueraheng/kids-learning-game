import { BadRequestException, Global, Injectable, Module } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { Prisma, Question } from '../generated/prisma/client.js';
import type { AttemptContext } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SkillsService } from '../skills/skills.module.js';
import { generateQuestion, type QuestionVisual } from './generators.js';
import { hintRemovals } from './hint-remove.js';
import type { Theme } from './themes.js';

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  answer: string;

  @IsInt()
  @Min(0)
  @Max(30 * 60 * 1000)
  timeMs: number;

  @IsOptional()
  @IsBoolean()
  hintUsed?: boolean;
}

/** What the child sees — never includes the answer. */
export interface PublicQuestion {
  id: string;
  skillCode: string;
  difficulty: number;
  prompt: string;
  expression: string | null;
  visual: QuestionVisual | null;
  options: string[];
  hint: string | null;
  /** Wrong options the hint crosses out, for children who cannot read the hint yet. */
  hintRemove: string[];
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  async serve(skillCode: string, difficulty: number, theme: Theme = 'GENERAL'): Promise<PublicQuestion> {
    const skill = await this.skills.byCode(skillCode);
    const q = generateQuestion(skillCode, difficulty, Math.random, { theme });
    const row = await this.prisma.question.create({
      data: {
        skillId: skill.id,
        difficulty,
        prompt: q.prompt,
        expression: q.expression,
        visual: (q.visual ?? undefined) as Prisma.InputJsonValue | undefined,
        options: q.options,
        answer: q.answer,
        hint: q.hint,
      },
    });
    return this.toPublic(row, skillCode);
  }

  async findPublic(id: string): Promise<PublicQuestion> {
    const row = await this.prisma.question.findUniqueOrThrow({ where: { id } });
    return this.toPublic(row, (await this.skills.byId(row.skillId)).code);
  }

  /**
   * Checks and records an answer. Callers must first verify the question is the
   * one currently pending for this student's assessment or session.
   */
  async recordAttempt(
    studentId: string,
    dto: AnswerDto,
    context: AttemptContext,
    ref: { assessmentId?: string; sessionId?: string },
  ) {
    const question = await this.prisma.question.findUniqueOrThrow({ where: { id: dto.questionId } });
    const options = question.options as string[];
    if (!options.includes(dto.answer)) throw new BadRequestException('Answer is not one of the options');

    const isCorrect = dto.answer === question.answer;
    const attempt = await this.prisma.questionAttempt.create({
      data: {
        studentId,
        questionId: question.id,
        skillId: question.skillId,
        difficulty: question.difficulty,
        answer: dto.answer,
        isCorrect,
        timeMs: dto.timeMs,
        hintUsed: dto.hintUsed ?? false,
        context,
        ...ref,
      },
    });
    return { attempt, isCorrect, correctAnswer: question.answer, question };
  }

  private toPublic(q: Question, skillCode: string): PublicQuestion {
    return {
      id: q.id,
      skillCode,
      difficulty: q.difficulty,
      prompt: q.prompt,
      expression: q.expression,
      visual: q.visual as QuestionVisual | null,
      options: q.options as string[],
      hint: q.hint,
      hintRemove: hintRemovals(q.options as string[], q.answer, q.id),
    };
  }
}

@Global()
@Module({ providers: [QuestionsService], exports: [QuestionsService] })
export class QuestionsModule {}
