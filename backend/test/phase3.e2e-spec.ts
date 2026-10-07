import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** Phase 3: a P6 child places into decimals and plays the advanced worlds. */
describe('Phase 3 — advanced mathematics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let placement: { skillCode: string; source: string; mastery: number }[];

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const answerOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).answer;

  interface Q {
    id: string;
    skillCode: string;
    options: string[];
    visual: { kind: string } | null;
  }

  // Knows everything up to simple equations; percentage, ratio and patterns are new.
  const UNKNOWN = ['PERCENT_CONCEPT', 'PERCENT_OF', 'RATIO_CONCEPT', 'RATIO_PROPORTION', 'ALG_PATTERNS', 'PS_MULTI_STEP'];

  async function play(levelId: string) {
    let res = await api().post(`/games/levels/${levelId}/sessions`).set(auth()).expect(201);
    const { sessionId } = res.body;
    const questions: Q[] = [];
    let question: Q | null = res.body.question;
    while (question) {
      questions.push(question);
      res = await api()
        .post(`/games/sessions/${sessionId}/answer`)
        .set(auth())
        .send({ questionId: question.id, answer: await answerOf(question.id), timeMs: 3000 })
        .expect(201);
      expect(res.body.isCorrect).toBe(true);
      question = res.body.question;
    }
    return { summary: res.body.summary, questions };
  }
  const world = async (code: string) =>
    (await api().get('/games/worlds').set(auth()).expect(200)).body.find((w: { code: string }) => w.code === code);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const reg = await api().post('/auth/register').send({ nickname: 'ป6', avatar: '🦊', grade: 'P6' }).expect(201);
    token = reg.body.token;
    userId = (await prisma.student.findUniqueOrThrow({ where: { id: reg.body.student.id } })).userId;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('starts a P6 placement at decimals and finds the edge at percentages', async () => {
    let res = await api().post('/assessments/placement').set(auth()).expect(201);
    const { assessmentId } = res.body;
    expect(res.body.question.skillCode).toBe('DEC_CONCEPT');
    let question: Q | null = res.body.question;
    while (question) {
      const right = await answerOf(question.id);
      const answer = UNKNOWN.includes(question.skillCode) ? question.options.find((o) => o !== right) : right;
      res = await api()
        .post(`/assessments/${assessmentId}/answer`)
        .set(auth())
        .send({ questionId: question.id, answer, timeMs: 3000 })
        .expect(201);
      question = res.body.question;
    }
    placement = res.body.result.skills;
    const by = Object.fromEntries(placement.map((s) => [s.skillCode, s]));
    expect(by.ALG_EQUATIONS.source).toBe('tested');
    expect(by.PERCENT_CONCEPT.mastery).toBeLessThan(0.6);
    expect(by.MULT_TABLES_6_10.source).toBe('inferred');
    expect(by.PS_MULTI_STEP).toBeUndefined();
  });

  it('recommends percentages next', async () => {
    const plan = (await api().get('/learning-path').set(auth()).expect(200)).body;
    expect(plan.current).toBe('PERCENT_CONCEPT');
    const locked = plan.path.find((p: { skillCode: string }) => p.skillCode === 'PS_MULTI_STEP');
    expect(locked.state).toBe('LOCKED');
  });

  it('plays a decimal stage with the 100-grid picture', async () => {
    const island = await world('DECIMAL_ISLAND');
    expect(island.unlocked).toBe(true);
    const { summary, questions } = await play(island.levels[0].id);
    expect(questions.every((q) => q.skillCode === 'DEC_CONCEPT')).toBe(true);
    expect(questions.some((q) => q.visual?.kind === 'grid100')).toBe(true);
    expect(summary.stars).toBe(3);
  });

  it('plays a geometry stage with shapes', async () => {
    const canyon = await world('GEOMETRY_CANYON');
    const { summary, questions } = await play(canyon.levels[2].id); // perimeter
    expect(questions.every((q) => q.visual?.kind === 'rect')).toBe(true);
    expect(summary.stars).toBe(3);
  });

  it('keeps percent-of locked until the concept is learnt', async () => {
    const city = await world('PERCENT_CITY');
    const stage = (name: string) => city.levels.find((l: { name: string }) => l.name === name);
    expect(stage('ป้ายไฟร้อยช่อง').unlocked).toBe(true);
    expect(stage('ห้างลดราคา').unlocked).toBe(false);
    await api().post(`/games/levels/${stage('ห้างลดราคา').id}/sessions`).set(auth()).expect(403);
    expect(city.levels.at(-1).unlocked).toBe(false);
  });

  it('defeats the Decimal Island boss and earns the dolphin', async () => {
    const boss = (await world('DECIMAL_ISLAND')).levels.at(-1);
    expect(boss.unlocked).toBe(true);
    expect(boss.skillCodes).toEqual(['DEC_CONCEPT', 'DEC_COMPARE', 'DEC_ADD_SUB', 'FRAC_ADD_SUB']);
    const { summary, questions } = await play(boss.id);
    expect(new Set(questions.map((q) => q.skillCode)).size).toBe(4);
    expect(summary.reward).toMatchObject({ code: 'DOLPHIN' });
  });
});
