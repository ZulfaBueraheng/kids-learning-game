import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Full Phase 1 loop against a real database (DATABASE_URL, seeded):
 * register → placement → learning path → play a stage → dashboard.
 */
describe('Phase 1 learning loop (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const answerOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).answer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('rejects requests without a token', async () => {
    await api().get('/progress/dashboard').expect(401);
  });

  it('registers a student and logs back in with the code', async () => {
    const res = await api().post('/auth/register').send({ nickname: 'ทดสอบ', avatar: '🦁', grade: 'K3' }).expect(201);
    expect(res.body.loginCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    token = res.body.token;
    userId = (await prisma.student.findUniqueOrThrow({ where: { id: res.body.student.id } })).userId;

    const login = await api().post('/auth/login').send({ loginCode: res.body.loginCode.toLowerCase() }).expect(201);
    expect(login.body.student.nickname).toBe('ทดสอบ');
  });

  it('runs an adaptive placement and builds a skill profile', async () => {
    let res = await api().post('/assessments/placement').set(auth()).expect(201);
    const { assessmentId } = res.body;
    expect(res.body.question.skillCode).toBe('ADD_SINGLE'); // K3 starts at single-digit addition
    expect(res.body.question).not.toHaveProperty('answer');

    // A child who can count and add, but not subtract yet.
    let question = res.body.question;
    while (question) {
      const knows = ['NUM_RECOGNITION', 'COUNTING', 'QUANTITY', 'ADD_SINGLE'].includes(question.skillCode);
      const correct = await answerOf(question.id);
      const answer = knows ? correct : question.options.find((o: string) => o !== correct);
      res = await api()
        .post(`/assessments/${assessmentId}/answer`)
        .set(auth())
        .send({ questionId: question.id, answer, timeMs: 3000 })
        .expect(201);
      question = res.body.question;
    }

    const skills = Object.fromEntries(res.body.result.skills.map((s: { skillCode: string }) => [s.skillCode, s]));
    expect(skills.ADD_SINGLE.source).toBe('tested');
    expect(skills.COMPARING.mastery).toBeLessThan(0.6);
    expect(skills.COUNTING.source).toBe('inferred');
    expect(res.body.result.newAchievements.map((a: { code: string }) => a.code)).toContain('FIRST_STEP');
  });

  it('cannot answer the same question twice', async () => {
    const attempt = await prisma.questionAttempt.findFirstOrThrow({ where: { student: { userId } } });
    await api()
      .post(`/assessments/${attempt.assessmentId}/answer`)
      .set(auth())
      .send({ questionId: attempt.questionId, answer: attempt.answer, timeMs: 1000 })
      .expect(400);
  });

  it('recommends a path that targets the knowledge gap', async () => {
    const res = await api().get('/learning-path').set(auth()).expect(200);
    const codes = res.body.path.map((p: { skillCode: string }) => p.skillCode);
    expect(codes).not.toContain('COUNTING');
    expect(codes).toContain('SUB_SINGLE');
    expect(res.body.current).toBeTruthy();
  });

  it('plays a stage, earns stars and XP, and updates mastery', async () => {
    const worlds = (await api().get('/games/worlds').set(auth()).expect(200)).body;
    const castle = worlds.find((w: { code: string }) => w.code === 'ADDITION_CASTLE');
    const stage = castle.levels[0];
    expect(stage.unlocked).toBe(true);

    const locked = worlds.flatMap((w: { levels: { unlocked: boolean; id: string }[] }) => w.levels).find((l: { unlocked: boolean }) => !l.unlocked);
    await api().post(`/games/levels/${locked.id}/sessions`).set(auth()).expect(403);

    let res = await api().post(`/games/levels/${stage.id}/sessions`).set(auth()).expect(201);
    const { sessionId } = res.body;
    let question = res.body.question;
    while (question) {
      res = await api()
        .post(`/games/sessions/${sessionId}/answer`)
        .set(auth())
        .send({ questionId: question.id, answer: await answerOf(question.id), timeMs: 2500 })
        .expect(201);
      expect(res.body.isCorrect).toBe(true);
      question = res.body.question;
    }
    expect(res.body.summary.stars).toBe(3);
    expect(res.body.summary.xpEarned).toBeGreaterThan(0);
    expect(res.body.summary.skills[0].code).toBe('ADD_SINGLE');
    expect(res.body.summary.coinsEarned).toBeGreaterThan(0);
    expect(res.body.summary.newAchievements.map((a: { code: string }) => a.code)).toEqual(
      expect.arrayContaining(['FIRST_STAR', 'PERFECT_STAGE']),
    );
  });

  it('shows the student dashboard', async () => {
    const res = await api().get('/progress/dashboard').set(auth()).expect(200);
    expect(res.body.placementDone).toBe(true);
    expect(res.body.xp).toBeGreaterThan(0);
    expect(res.body.stats.activitiesCompleted).toBe(1);
    expect(res.body.skills).toHaveLength(41);
    expect(res.body.strong.map((s: { code: string }) => s.code)).toContain('COUNTING');
  });
});
