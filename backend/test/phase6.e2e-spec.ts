import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** Phase 6: new subjects run on the same learning engine. */
describe('Phase 6 — more subjects on the same engine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const tag = Date.now().toString(36);
  let child: string;
  let childId: string;
  let childCode: string;

  const api = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const answerOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).answer;

  interface Q {
    id: string;
    skillCode: string;
    options: string[];
  }

  async function placement(knows: string[]) {
    let res = await api().post('/assessments/placement').set(as(child)).expect(201);
    const { assessmentId } = res.body;
    const first: Q = res.body.question;
    let q: Q | null = first;
    while (q) {
      const right = await answerOf(q.id);
      res = await api()
        .post(`/assessments/${assessmentId}/answer`)
        .set(as(child))
        .send({ questionId: q.id, answer: knows.includes(q.skillCode) ? right : q.options.find((o) => o !== right), timeMs: 3000 })
        .expect(201);
      q = res.body.question;
    }
    return { first, result: res.body.result };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const reg = await api().post('/auth/register').send({ nickname: 'หลายวิชา', avatar: '🐼', grade: 'K3' }).expect(201);
    child = reg.body.token;
    childId = reg.body.student.id;
    childCode = reg.body.loginCode;
    userIds.push((await prisma.student.findUniqueOrThrow({ where: { id: childId } })).userId);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lists five subjects and starts in mathematics', async () => {
    const subjects = (await api().get('/subjects').expect(200)).body;
    expect(subjects.map((s: { code: string }) => s.code)).toEqual(['MATH', 'ENGLISH', 'SCIENCE', 'READING', 'LOGIC']);
    const mine = (await api().get('/progress/subjects').set(as(child)).expect(200)).body;
    expect(mine.find((s: { active: boolean }) => s.active).code).toBe('MATH');
  });

  it('switches subject; the map, placement and dashboard follow', async () => {
    await api().put('/students/me/subject').set(as(child)).send({ subject: 'HISTORY' }).expect(400);
    const me = (await api().put('/students/me/subject').set(as(child)).send({ subject: 'ENGLISH' }).expect(200)).body;
    expect(me.activeSubject).toBe('ENGLISH');

    const worlds = (await api().get('/games/worlds').set(as(child)).expect(200)).body;
    expect(worlds.map((w: { code: string }) => w.code)).toEqual(['ABC_TOWN', 'WORD_JUNGLE', 'ENGLISH_SCHOOL', 'STORY_CITY', 'WORD_MINE']);

    const { first, result } = await placement(['EN_LETTERS', 'EN_PHONICS', 'EN_VOCAB_PICTURE']);
    expect(first.skillCode).toBe('EN_PHONICS'); // K3 starts at phonics
    expect(result.skills.every((s: { skillCode: string }) => s.skillCode.startsWith('EN_'))).toBe(true);

    const dash = (await api().get('/progress/dashboard').set(as(child)).expect(200)).body;
    expect(dash.subject).toBe('ENGLISH');
    expect(dash.skills).toHaveLength(12);
    expect(dash.placementDone).toBe(true);

    const plan = (await api().get('/learning-path').set(as(child)).expect(200)).body;
    expect(plan.subject).toBe('ENGLISH');
    expect(plan.path.every((p: { skillCode: string }) => p.skillCode.startsWith('EN_'))).toBe(true);
  });

  it('plays an English stage with the shared game engine', async () => {
    const worlds = (await api().get('/games/worlds').set(as(child)).expect(200)).body;
    const stage = worlds[0].levels.find((l: { unlocked: boolean; isBoss: boolean }) => l.unlocked && !l.isBoss);
    let res = await api().post(`/games/levels/${stage.id}/sessions`).set(as(child)).expect(201);
    const { sessionId } = res.body;
    let q: Q | null = res.body.question;
    while (q) {
      expect(q.skillCode.startsWith('EN_')).toBe(true);
      res = await api()
        .post(`/games/sessions/${sessionId}/answer`)
        .set(as(child))
        .send({ questionId: q.id, answer: await answerOf(q.id), timeMs: 3000 })
        .expect(201);
      q = res.body.question;
    }
    expect(res.body.summary.stars).toBe(3);
    const quests = (await api().get('/games/recommendations').set(as(child)).expect(200)).body;
    expect(quests.length).toBeGreaterThan(0);
  });

  it('keeps each subject separate: maths still needs its own placement', async () => {
    await api().put('/students/me/subject').set(as(child)).send({ subject: 'MATH' }).expect(200);
    const dash = (await api().get('/progress/dashboard').set(as(child)).expect(200)).body;
    expect(dash.subject).toBe('MATH');
    expect(dash.placementDone).toBe(false);
    expect(dash.skills).toHaveLength(41);
    const worlds = (await api().get('/games/worlds').set(as(child)).expect(200)).body;
    expect(worlds).toHaveLength(16);
    const subjects = (await api().get('/progress/subjects').set(as(child)).expect(200)).body;
    const english = subjects.find((s: { code: string }) => s.code === 'ENGLISH');
    expect(english.placementDone).toBe(true);
    expect(english.progress).toBeGreaterThan(0);
  });

  it('plays every new subject through placement on the same engine', async () => {
    for (const subject of ['SCIENCE', 'READING', 'LOGIC']) {
      await api().put('/students/me/subject').set(as(child)).send({ subject }).expect(200);
      const { first, result } = await placement([]);
      const prefix = { SCIENCE: 'SCI_', READING: 'TH_', LOGIC: 'LOG_' }[subject]!;
      expect(first.skillCode.startsWith(prefix)).toBe(true);
      expect(result.skills.every((s: { skillCode: string }) => s.skillCode.startsWith(prefix))).toBe(true);
    }
  });

  it('lets parents read each subject, and teachers assign any subject', async () => {
    const parent = await api()
      .post('/auth/adult/register')
      .send({ email: `p6-${tag}@example.com`, password: 'super-secret-1', displayName: 'แม่', role: 'PARENT' })
      .expect(201);
    userIds.push(parent.body.user.id);
    await api().post('/parent/children').set(as(parent.body.token)).send({ loginCode: childCode }).expect(201);
    const report = (await api().get(`/parent/children/${childId}/report?subject=ENGLISH`).set(as(parent.body.token)).expect(200)).body;
    expect(report.subject).toBe('ENGLISH');
    expect(report.subjects).toHaveLength(5);
    expect(report.skills.every((s: { code: string }) => s.code.startsWith('EN_'))).toBe(true);
    // The child played other subjects too, but the time table only covers this one.
    expect(report.skillTime.length).toBeGreaterThan(0);
    expect(report.skillTime.every((s: { skillCode: string }) => s.skillCode.startsWith('EN_'))).toBe(true);
    const logic = (await api().get(`/parent/children/${childId}/report?subject=LOGIC`).set(as(parent.body.token)).expect(200)).body;
    expect(logic.skillTime.every((s: { skillCode: string }) => s.skillCode.startsWith('LOG_'))).toBe(true);

    const teacher = await api()
      .post('/auth/adult/register')
      .send({ email: `t6-${tag}@example.com`, password: 'super-secret-1', displayName: 'ครู', role: 'TEACHER' })
      .expect(201);
    userIds.push(teacher.body.user.id);
    const room = (await api().post('/teacher/classrooms').set(as(teacher.body.token)).send({ name: 'ห้องรวมวิชา' }).expect(201)).body;
    await api().post('/students/me/classrooms').set(as(child)).send({ joinCode: room.joinCode }).expect(201);
    await api()
      .post(`/teacher/classrooms/${room.id}/assignments`)
      .set(as(teacher.body.token))
      .send({ skillCode: 'SCI_ANIMALS', questionCount: 3 })
      .expect(201);
    // Homework shows up whatever subject the child is on, and plays science questions.
    const quests = (await api().get('/games/recommendations').set(as(child)).expect(200)).body;
    expect(quests[0].kind).toBe('ASSIGNMENT');
    const start = (await api().post(`/games/assignments/${quests[0].assignmentId}`).set(as(child)).expect(201)).body;
    expect(start.question.skillCode).toBe('SCI_ANIMALS');
  });
});
