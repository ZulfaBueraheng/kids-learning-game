import { Controller, Get, Global, Injectable, Module, Query } from '@nestjs/common';
import { Public } from '../auth/auth.guard.js';
import { SUBJECTS } from '../curriculum/subjects.js';
import type { Grade } from '../generated/prisma/enums.js';
import { topologicalOrder, type SkillNode } from '../learning-path/learning-path.engine.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface SkillInfo extends SkillNode {
  id: string;
  subjectCode: string;
  group: string;
  name: string;
  nameTh: string;
  grade: Grade;
}

/** Curriculum data is static at runtime, so the skill graph is loaded once and cached. */
@Injectable()
export class SkillsService {
  private cache: Promise<SkillInfo[]> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** All skills, or only one subject's. Lookups by id/code always search every subject. */
  async all(subjectCode?: string): Promise<SkillInfo[]> {
    this.cache ??= this.load().catch((err) => {
      this.cache = null;
      throw err;
    });
    const skills = await this.cache;
    return subjectCode ? skills.filter((s) => s.subjectCode === subjectCode) : skills;
  }

  async byId(id: string): Promise<SkillInfo> {
    const skill = (await this.all()).find((s) => s.id === id);
    if (!skill) throw new Error(`Unknown skill id ${id}`);
    return skill;
  }

  async byCode(code: string): Promise<SkillInfo> {
    const skill = (await this.all()).find((s) => s.code === code);
    if (!skill) throw new Error(`Unknown skill code ${code}`);
    return skill;
  }

  /** Prerequisite order within a subject; with no subject, subjects follow each other in their usual order. */
  async ordered(subjectCode?: string): Promise<SkillInfo[]> {
    const codes = subjectCode ? [subjectCode] : SUBJECTS.map((s) => s.code);
    const out: SkillInfo[] = [];
    for (const code of codes) {
      const skills = await this.all(code);
      out.push(...topologicalOrder(skills).map((c) => skills.find((s) => s.code === c)!));
    }
    return out;
  }

  private async load(): Promise<SkillInfo[]> {
    const rows = await this.prisma.skill.findMany({
      include: { subject: true, prerequisites: { include: { prerequisite: true } } },
      orderBy: [{ subject: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      subjectCode: s.subject.code,
      group: s.group,
      name: s.name,
      nameTh: s.nameTh,
      grade: s.grade,
      sortOrder: s.sortOrder,
      prerequisites: s.prerequisites.map((p) => p.prerequisite.code),
    }));
  }
}

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  list(@Query('subject') subject?: string) {
    return this.skills.ordered(subject || undefined);
  }
}

@Controller('subjects')
export class SubjectsController {
  /** Just the catalogue of subjects; no child data. */
  @Public()
  @Get()
  list() {
    return SUBJECTS.map((s) => ({ code: s.code, name: s.name, nameTh: s.nameTh, emoji: s.emoji }));
  }
}

@Global()
@Module({ controllers: [SkillsController, SubjectsController], providers: [SkillsService], exports: [SkillsService] })
export class SkillsModule {}
