import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { THEME_PACKS } from '../src/questions/themes.js';

/** Phase 4: interests, recommendations, spaced review, adaptive difficulty and goals. */
describe('Phase 4 — personalization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let studentId: string;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const answerOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).answer;
  const difficultyOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).difficulty;

  interface Q {
    id: string;
    skillCode: string;
    options: string[];
    visual: { kind: string; emoji?: string } | null;
  }

  const world = async (code: string) =>
    (await api().get('/games/worlds').set(auth()).expect(200)).body.find((w: { code: string }) => w.code === code);

  async function answer(sessionId: string, q: Q, right: boolean, timeMs = 6000) {
    const correct = await answerOf(q.id);
    return api()
      .post(`/games/sessions/${sessionId}/answer`)
      .set(auth())
      .send({ questionId: q.id, answer: right ? correct : q.options.find((o) => o !== correct), timeMs })
      .expect(201);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const reg = await api()
      .post('/auth/register')
      .send({ nickname: 'ไดโน', avatar: '🐲', grade: 'K3', interests: ['DINOSAUR'] })
      .expect(201);
    token = reg.body.token;
    studentId = reg.body.student.id;
    userId = (await prisma.student.findUniqueOrThrow({ where: { id: studentId } })).userId;

    let res = await api().post('/assessments/placement').set(auth()).expect(201);
    const { assessmentId } = res.body;
    let q: Q | null = res.body.question;
    while (q) {
      const knows = ['NUM_RECOGNITION', 'COUNTING', 'QUANTITY', 'ADD_SINGLE'].includes(q.skillCode);
      const right = await answerOf(q.id);
      res = await api()
        .post(`/assessments/${assessmentId}/answer`)
        .set(auth())
        .send({ questionId: q.id, answer: knows ? right : q.options.find((o) => o !== right), timeMs: 3000 })
        .expect(201);
      q = res.body.question;
    }
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('stores interests picked at sign-up and lets the child change them', async () => {
    const me = (await api().get('/students/me').set(auth()).expect(200)).body;
    expect(me.interests).toEqual([{ theme: 'DINOSAUR', score: 5, level: 1 }]);
    await api().put('/students/me/interests').set(auth()).send({ themes: ['NOPE'] }).expect(400);
    const updated = (await api().put('/students/me/interests').set(auth()).send({ themes: ['DINOSAUR', 'SPACE'] }).expect(200)).body;
    expect(updated.interests.map((i: { theme: string }) => i.theme).sort()).toEqual(['DINOSAUR', 'SPACE']);
  });

  it('presents a stage in one of the child’s themes', async () => {
    const forest = await world('COUNTING_FOREST');
    const counting = forest.levels.find((l: { skillCode: string }) => l.skillCode === 'COUNTING');
    const start = (await api().post(`/games/levels/${counting.id}/sessions`).set(auth()).expect(201)).body;
    expect(['DINOSAUR', 'SPACE', 'GENERAL']).toContain(start.theme);
    const allowed = new Set(THEME_PACKS[start.theme as 'DINOSAUR'].things.map((t) => t.emoji));
    expect(allowed.has(start.question.visual.emoji)).toBe(true);
  });

  it('starts a stage near the child’s mastery', async () => {
    const castle = await world('ADDITION_CASTLE');
    const stage = castle.levels[0]; // ADD_SINGLE, designed at difficulty 1; child placed strong
    expect(stage.difficulty).toBe(1);
    const start = (await api().post(`/games/levels/${stage.id}/sessions`).set(auth()).expect(201)).body;
    expect(await difficultyOf(start.question.id)).toBe(2);
  });

  it('eases off and offers help after two mistakes in a row', async () => {
    const castle = await world('ADDITION_CASTLE');
    const stage = castle.levels[1]; // difficulty 3
    const start = (await api().post(`/games/levels/${stage.id}/sessions`).set(auth()).expect(201)).body;
    let res = await answer(start.sessionId, start.question, false);
    expect(res.body.support).toBe(false);
    res = await answer(start.sessionId, res.body.question, false);
    expect(res.body.support).toBe(true);
    expect(await difficultyOf(res.body.question.id)).toBe(2); // base 3 − 1
  });

  it('recommends today’s quests: the next skill and the awake boss', async () => {
    const recs = (await api().get('/games/recommendations').set(auth()).expect(200)).body;
    const kinds = recs.map((r: { kind: string }) => r.kind);
    expect(kinds).toContain('LEARN');
    expect(kinds).toContain('BOSS');
    for (const r of recs) expect(r.reason.length).toBeGreaterThan(0);
  });

  it('runs a spaced review when a skill is due, and schedules the next one further out', async () => {
    await api().post('/games/review').set(auth()).expect(400); // nothing due yet
    const counting = await prisma.skill.findUniqueOrThrow({ where: { code: 'COUNTING' } });
    await prisma.studentSkill.update({
      where: { studentId_skillId: { studentId, skillId: counting.id } },
      data: { nextReviewAt: new Date(Date.now() - 60_000), lastPracticedAt: new Date(Date.now() - 3 * 86400_000) },
    });

    const recs = (await api().get('/games/recommendations').set(auth()).expect(200)).body;
    expect(recs[0]).toMatchObject({ kind: 'REVIEW', levelId: null });
    expect(recs[0].skillCodes).toContain('COUNTING');

    const start = (await api().post('/games/review').set(auth()).expect(201)).body;
    expect(start.level.id).toBe('review');
    expect(start.total).toBe(6);
    let q: Q | null = start.question;
    let res;
    const seen = new Set<string>();
    while (q) {
      seen.add(q.skillCode);
      res = await answer(start.sessionId, q, true);
      q = res.body.question;
    }
    expect(seen.has('COUNTING')).toBe(true);
    expect(res!.body.summary.stars).toBe(3);

    const row = await prisma.studentSkill.findUniqueOrThrow({ where: { studentId_skillId: { studentId, skillId: counting.id } } });
    expect(row.reviewCount).toBe(1);
    expect(row.nextReviewAt!.getTime()).toBeGreaterThan(Date.now() + 2 * 86400_000);
  });

  it('learns interests from sessions the child enjoyed', async () => {
    const session = await prisma.gameSession.findFirstOrThrow({
      where: { studentId, mode: 'REVIEW', status: 'COMPLETED' },
    });
    const me = (await api().get('/students/me').set(auth()).expect(200)).body;
    const score = (t: string) => me.interests.find((i: { theme: string }) => i.theme === t)?.score ?? 0;
    if (session.theme !== 'GENERAL') expect(score(session.theme)).toBeGreaterThan(5);
  });

  it('builds the path around the chosen goal', async () => {
    await api().put('/students/me/goal').set(auth()).send({ goal: 'SOMETHING' }).expect(400);
    await api().put('/students/me/goal').set(auth()).send({ goal: 'PROBLEM_SOLVING' }).expect(200);
    const plan = (await api().get('/learning-path').set(auth()).expect(200)).body;
    const codes = plan.path.map((p: { skillCode: string }) => p.skillCode);
    expect(plan.goal).toBe('PROBLEM_SOLVING');
    expect(codes).toContain('WORD_ADD_SUB');
    expect(codes).not.toContain('GEO_ANGLES');

    await api().put('/students/me/goal').set(auth()).send({ goal: 'GRADE_LEVEL' }).expect(200);
    const k3 = (await api().get('/learning-path').set(auth()).expect(200)).body;
    expect(k3.path.map((p: { skillCode: string }) => p.skillCode)).not.toContain('MULT_CONCEPT');
  });
});
