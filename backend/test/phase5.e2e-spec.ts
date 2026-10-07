import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** Phase 5: parents, teachers, classrooms, assignments, reports, privacy. */
describe('Phase 5 — parent & teacher platform (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const tag = Date.now().toString(36);

  let child: { token: string; code: string; id: string };
  let other: { token: string; code: string; id: string };
  let parent: string;
  let teacher: string;
  let strangerTeacher: string;
  let classroom: { id: string; joinCode: string };

  const api = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const answerOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).answer;

  async function newChild(nickname: string) {
    const res = await api().post('/auth/register').send({ nickname, avatar: '🦁', grade: 'P1' }).expect(201);
    const s = await prisma.student.findUniqueOrThrow({ where: { id: res.body.student.id } });
    userIds.push(s.userId);
    return { token: res.body.token as string, code: res.body.loginCode as string, id: s.id };
  }
  async function newAdult(role: 'PARENT' | 'TEACHER', name: string) {
    const email = `${name}-${tag}@example.com`;
    const res = await api()
      .post('/auth/adult/register')
      .send({ email, password: 'super-secret-1', displayName: name, role })
      .expect(201);
    userIds.push(res.body.user.id);
    return res.body.token as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    child = await newChild('น้องเอ');
    other = await newChild('น้องบี');
    parent = await newAdult('PARENT', 'แม่เอ');
    teacher = await newAdult('TEACHER', 'ครูสมใจ');
    strangerTeacher = await newAdult('TEACHER', 'ครูคนอื่น');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  describe('grown-up accounts', () => {
    it('logs in with email and password, rejects wrong passwords and duplicates', async () => {
      const email = `ครูสมใจ-${tag}@example.com`;
      await api().post('/auth/adult/login').send({ email, password: 'wrong-password' }).expect(401);
      await api().post('/auth/adult/login').send({ email: email.toUpperCase(), password: 'super-secret-1' }).expect(201);
      await api().post('/auth/adult/login').send({ email: 'not-an-email', password: 'x' }).expect(400);
      await api().post('/auth/adult/login').send({ email: `nobody-${tag}@example.com`, password: 'whatever1' }).expect(401);
      await api()
        .post('/auth/adult/register')
        .send({ email: `ครูสมใจ-${tag}@example.com`, password: 'short', displayName: 'x', role: 'TEACHER' })
        .expect(400);
      const me = (await api().get('/auth/adult/me').set(as(teacher)).expect(200)).body;
      expect(me.role).toBe('TEACHER');
      expect(me).not.toHaveProperty('passwordHash');
    });

    it('keeps child routes and grown-up routes apart', async () => {
      await api().get('/progress/dashboard').set(as(parent)).expect(403);
      await api().get('/parent/children').set(as(child.token)).expect(403);
      await api().get('/teacher/classrooms').set(as(parent)).expect(403);
    });
  });

  describe('parent', () => {
    it('links a child only with the child’s code', async () => {
      await api().post('/parent/children').set(as(parent)).send({ loginCode: 'ZZZZ-ZZZZ' }).expect(400);
      const list = (await api().post('/parent/children').set(as(parent)).send({ loginCode: child.code }).expect(201)).body;
      expect(list.map((c: { nickname: string }) => c.nickname)).toEqual(['น้องเอ']);
      await api().post('/parent/children').set(as(parent)).send({ loginCode: child.code }).expect(409);
    });

    it('sees reports only for linked children', async () => {
      const report = (await api().get(`/parent/children/${child.id}/report`).set(as(parent)).expect(200)).body;
      expect(report.student.nickname).toBe('น้องเอ');
      expect(report.week).toHaveLength(7);
      expect(Array.isArray(report.insights)).toBe(true);
      await api().get(`/parent/children/${other.id}/report`).set(as(parent)).expect(404);
    });
  });

  describe('teacher and classroom', () => {
    it('creates a class that children join with a code', async () => {
      classroom = (await api().post('/teacher/classrooms').set(as(teacher)).send({ name: 'ป.1/2', grade: 'P1' }).expect(201)).body;
      expect(classroom.joinCode).toMatch(/^[A-Z0-9]{6}$/);
      await api().post('/students/me/classrooms').set(as(child.token)).send({ joinCode: 'AAAAAA' }).expect(400);
      const mine = (
        await api().post('/students/me/classrooms').set(as(child.token)).send({ joinCode: classroom.joinCode.toLowerCase() }).expect(201)
      ).body;
      expect(mine).toEqual([{ id: classroom.id, name: 'ป.1/2', teacher: 'ครูสมใจ' }]);
    });

    it('shows the teacher only their own students', async () => {
      await api().get(`/teacher/classrooms/${classroom.id}`).set(as(strangerTeacher)).expect(404);
      await api().get(`/teacher/classrooms/${classroom.id}/students/${child.id}/report`).set(as(strangerTeacher)).expect(404);
      await api().get(`/teacher/classrooms/${classroom.id}/students/${other.id}/report`).set(as(teacher)).expect(404);
      const report = (await api().get(`/teacher/classrooms/${classroom.id}/students/${child.id}/report`).set(as(teacher)).expect(200)).body;
      expect(report.student.nickname).toBe('น้องเอ');
    });

    it('assigns homework that appears first in the child’s quests', async () => {
      await api()
        .post(`/teacher/classrooms/${classroom.id}/assignments`)
        .set(as(teacher))
        .send({ skillCode: 'NOPE', questionCount: 5 })
        .expect(400);
      const due = new Date(Date.now() + 3 * 86400_000).toISOString();
      const overview = (
        await api()
          .post(`/teacher/classrooms/${classroom.id}/assignments`)
          .set(as(teacher))
          .send({ skillCode: 'ADD_SINGLE', questionCount: 4, dueAt: due })
          .expect(201)
      ).body;
      expect(overview.assignments[0]).toMatchObject({ title: 'ฝึกบวกเลขหลักเดียว', counts: { pending: 1, done: 0 } });

      const quests = (await api().get('/games/recommendations').set(as(child.token)).expect(200)).body;
      expect(quests[0]).toMatchObject({ kind: 'ASSIGNMENT', title: 'ฝึกบวกเลขหลักเดียว' });
      const mine = (await api().get('/students/me/assignments').set(as(child.token)).expect(200)).body;
      expect(mine[0].state).toBe('PENDING');
    });

    it('the child completes the homework and the teacher sees the result', async () => {
      const { assignmentId } = (await api().get('/games/recommendations').set(as(child.token)).expect(200)).body[0];
      await api().post(`/games/assignments/${assignmentId}`).set(as(other.token)).expect(404); // not in the class
      const start = (await api().post(`/games/assignments/${assignmentId}`).set(as(child.token)).expect(201)).body;
      expect(start.total).toBe(4);
      let q = start.question;
      let res;
      while (q) {
        expect(q.skillCode).toBe('ADD_SINGLE');
        res = await api()
          .post(`/games/sessions/${start.sessionId}/answer`)
          .set(as(child.token))
          .send({ questionId: q.id, answer: await answerOf(q.id), timeMs: 3000 })
          .expect(201);
        q = res.body.question;
      }
      expect(res!.body.summary.stars).toBe(3);

      const overview = (await api().get(`/teacher/classrooms/${classroom.id}`).set(as(teacher)).expect(200)).body;
      expect(overview.assignments[0].counts.done).toBe(1);
      expect(overview.assignments[0].results[0]).toMatchObject({ nickname: 'น้องเอ', state: 'DONE', correct: 4, total: 4 });
      expect(overview.columns.map((c: { code: string }) => c.code)).toContain('ADD_SINGLE');
      expect(overview.students[0].cells.ADD_SINGLE).toMatch(/[✓△✗]/);
      const quests = (await api().get('/games/recommendations').set(as(child.token)).expect(200)).body;
      expect(quests.some((r: { kind: string }) => r.kind === 'ASSIGNMENT')).toBe(false);
    });
  });

  describe('privacy and parental control', () => {
    it('tells the parent which classes can see the child, and lets them remove access', async () => {
      const report = (await api().get(`/parent/children/${child.id}/report`).set(as(parent)).expect(200)).body;
      expect(report.classrooms).toEqual([{ id: classroom.id, name: 'ป.1/2', teacher: 'ครูสมใจ' }]);
      await api().delete(`/parent/children/${child.id}/classrooms/${classroom.id}`).set(as(parent)).expect(200);
      await api().get(`/teacher/classrooms/${classroom.id}/students/${child.id}/report`).set(as(teacher)).expect(404);
    });

    it('keeps an audit log of who accessed or changed the child’s data', async () => {
      const log = (await api().get(`/parent/children/${child.id}/access-log`).set(as(parent)).expect(200)).body;
      const actions = log.map((l: { action: string }) => l.action);
      expect(actions).toEqual(expect.arrayContaining(['PARENT_LINK_CHILD', 'CLASS_JOIN', 'REPORT_VIEW', 'PARENT_REMOVE_FROM_CLASS']));
      expect(log.find((l: { action: string; by: { role: string } | null }) => l.action === 'REPORT_VIEW' && l.by?.role === 'TEACHER')).toBeTruthy();
    });

    it('unlinking removes the parent’s access', async () => {
      await api().delete(`/parent/children/${child.id}`).set(as(parent)).expect(200);
      await api().get(`/parent/children/${child.id}/report`).set(as(parent)).expect(404);
    });
  });
});
