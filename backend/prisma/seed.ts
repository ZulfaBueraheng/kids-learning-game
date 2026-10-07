import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { SUBJECTS } from '../src/curriculum/subjects.js';
import { BOSS_MAX_QUESTIONS } from '../src/games/game.engine.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { ACHIEVEMENTS } from '../src/rewards/rewards.engine.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Idempotent: safe to run again after editing the curriculum. */
async function main() {
  const skillIds = new Map<string, string>();
  let itemOrder = 0;

  for (const [si, subject] of SUBJECTS.entries()) {
    const subjectData = { name: subject.nameTh, emoji: subject.emoji, sortOrder: si };
    const row = await prisma.subject.upsert({
      where: { code: subject.code },
      create: { code: subject.code, ...subjectData },
      update: subjectData,
    });

    for (const [i, s] of subject.skills.entries()) {
      const data = { group: s.group, name: s.name, nameTh: s.nameTh, grade: s.grade, sortOrder: i, subjectId: row.id };
      const skill = await prisma.skill.upsert({ where: { code: s.code }, create: { code: s.code, ...data }, update: data });
      skillIds.set(s.code, skill.id);
    }
    const ids = subject.skills.map((s) => skillIds.get(s.code)!);
    await prisma.skillPrerequisite.deleteMany({ where: { skillId: { in: ids } } });
    await prisma.skillPrerequisite.createMany({
      data: subject.skills.flatMap((s) =>
        s.prerequisites.map((p) => ({ skillId: skillIds.get(s.code)!, prerequisiteId: skillIds.get(p)! })),
      ),
    });

    for (const [wi, w] of subject.worlds.entries()) {
      // Worlds are ordered by subject first, then within the subject.
      const worldData = { name: w.name, nameTh: w.nameTh, emoji: w.emoji, theme: w.theme, sortOrder: si * 100 + wi, subjectId: row.id };
      const world = await prisma.world.upsert({ where: { code: w.code }, create: { code: w.code, ...worldData }, update: worldData });
      for (const [li, stage] of w.stages.entries()) {
        const data = {
          skillId: skillIds.get(stage.skill)!,
          name: stage.name,
          activity: stage.activity,
          difficulty: stage.difficulty,
          questionCount: stage.questionCount ?? 5,
        };
        await prisma.gameLevel.upsert({
          where: { worldId_sortOrder: { worldId: world.id, sortOrder: li + 1 } },
          create: { worldId: world.id, sortOrder: li + 1, ...data },
          update: data,
        });
      }
      // The boss closes every world and mixes all of its skills.
      const bossData = {
        skillId: skillIds.get(w.stages[w.stages.length - 1].skill)!,
        name: w.boss.name,
        bossEmoji: w.boss.emoji,
        activity: 'BOSS' as const,
        difficulty: w.boss.difficulty,
        questionCount: BOSS_MAX_QUESTIONS,
        isBoss: true,
      };
      const bossOrder = w.stages.length + 1;
      await prisma.gameLevel.upsert({
        where: { worldId_sortOrder: { worldId: world.id, sortOrder: bossOrder } },
        create: { worldId: world.id, sortOrder: bossOrder, ...bossData },
        update: bossData,
      });
    }

    for (const item of subject.items) {
      const data = {
        name: item.name,
        slot: item.slot,
        emoji: item.emoji,
        price: item.price,
        rewardWorldCode: item.rewardWorldCode ?? null,
        sortOrder: itemOrder++,
      };
      await prisma.item.upsert({ where: { code: item.code }, create: { code: item.code, ...data }, update: data });
    }
  }

  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { code: a.code }, create: a, update: a });
  }

  const count = (f: (s: (typeof SUBJECTS)[number]) => number) => SUBJECTS.reduce((n, s) => n + f(s), 0);
  console.log(
    `Seeded ${SUBJECTS.length} subjects, ${count((s) => s.skills.length)} skills, ${count((s) => s.worlds.length)} worlds, ` +
      `${count((s) => s.worlds.reduce((n, w) => n + w.stages.length, 0))} stages + ${count((s) => s.worlds.length)} bosses, ` +
      `${count((s) => s.items.length)} items, ${ACHIEVEMENTS.length} achievements`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
