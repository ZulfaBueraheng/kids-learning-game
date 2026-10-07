import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/** Phase 2: new worlds, boss battles, coins, shop and character. */
describe('Phase 2 — bosses, rewards and character (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let studentId: string;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const answerOf = async (questionId: string) =>
    (await prisma.question.findUniqueOrThrow({ where: { id: questionId } })).answer;

  interface Q {
    id: string;
    skillCode: string;
    options: string[];
  }

  /** Plays a whole stage; `shouldBeRight(i)` decides each answer. */
  async function play(levelId: string, shouldBeRight: (i: number) => boolean) {
    let res = await api().post(`/games/levels/${levelId}/sessions`).set(auth()).expect(201);
    const { sessionId } = res.body;
    const skills: string[] = [];
    let question: Q | null = res.body.question;
    let i = 0;
    while (question) {
      skills.push(question.skillCode);
      const right = await answerOf(question.id);
      const answer = shouldBeRight(i++) ? right : question.options.find((o) => o !== right);
      res = await api()
        .post(`/games/sessions/${sessionId}/answer`)
        .set(auth())
        .send({ questionId: question.id, answer, timeMs: 2000 })
        .expect(201);
      question = res.body.question;
    }
    return { start: res.body, summary: res.body.summary, skills, last: res.body };
  }

  const worlds = async () => (await api().get('/games/worlds').set(auth()).expect(200)).body;
  const world = async (code: string) => (await worlds()).find((w: { code: string }) => w.code === code);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const reg = await api().post('/auth/register').send({ nickname: 'บอส', avatar: '🐲', grade: 'K3' }).expect(201);
    token = reg.body.token;
    studentId = reg.body.student.id;
    userId = (await prisma.student.findUniqueOrThrow({ where: { id: studentId } })).userId;

    // Placement: knows the K-level basics, so Counting Forest skills become mastered.
    let res = await api().post('/assessments/placement').set(auth()).expect(201);
    const { assessmentId } = res.body;
    let question: Q | null = res.body.question;
    while (question) {
      const knows = ['NUM_RECOGNITION', 'COUNTING', 'QUANTITY', 'ADD_SINGLE'].includes(question.skillCode);
      const right = await answerOf(question.id);
      res = await api()
        .post(`/assessments/${assessmentId}/answer`)
        .set(auth())
        .send({ questionId: question.id, answer: knows ? right : question.options.find((o) => o !== right), timeMs: 2000 })
        .expect(201);
      question = res.body.question;
    }
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('has 16 maths worlds in map order, each ending with a boss', async () => {
    const all = await worlds();
    expect(all.map((w: { code: string }) => w.code).slice(0, 11)).toEqual([
      'COUNTING_FOREST',
      'NUMBER_VILLAGE',
      'SHAPE_FAIR',
      'ADDITION_CASTLE',
      'SUBTRACTION_DESERT',
      'MARKET_TOWN',
      'BLOCK_MINE',
      'MULTIPLICATION_VOLCANO',
      'DIVISION_OCEAN',
      'FRACTION_MOON',
      'MATH_SPACE',
    ]);
    expect(all).toHaveLength(16);
    for (const w of all) expect(w.levels.at(-1).isBoss).toBe(true);
    const village = all[1];
    expect(village.levels.at(-1).unlocked).toBe(false); // stages not cleared yet
  });

  it('opens Multiplication Volcano once addition is known and serves multiplication questions', async () => {
    const volcano = await world('MULTIPLICATION_VOLCANO');
    expect(volcano.unlocked).toBe(true);
    const { summary, skills } = await play(volcano.levels[0].id, () => true);
    expect(new Set(skills)).toEqual(new Set(['MULT_CONCEPT']));
    expect(summary.stars).toBe(3);
    expect(summary.unlocked.levels.map((l: { name: string }) => l.name)).toContain('ปริศนาลาวา');
  });

  it('wins a boss battle: mixes skills, grants a collectible and coins', async () => {
    const forest = await world('COUNTING_FOREST');
    const boss = forest.levels.at(-1);
    expect(boss.unlocked).toBe(true); // all forest skills mastered from placement
    expect(boss.skillCodes).toEqual(['NUM_RECOGNITION', 'COUNTING', 'QUANTITY']);

    const { summary, skills, last } = await play(boss.id, () => true);
    expect(new Set(skills)).toEqual(new Set(['NUM_RECOGNITION', 'COUNTING', 'QUANTITY']));
    expect(skills).toHaveLength(5); // 5 hits defeat the boss
    expect(last.boss).toMatchObject({ hp: 0, won: true });
    expect(summary.stars).toBe(3);
    expect(summary.reward).toMatchObject({ code: 'OWL', emoji: '🦉' });
    expect(summary.coinsEarned).toBeGreaterThanOrEqual(25);
    expect(summary.skills).toHaveLength(3);
    expect(summary.newAchievements.map((a: { code: string }) => a.code)).toContain('FIRST_BOSS');
  });

  it('losing a boss suggests a stage to practise and gives no second collectible', async () => {
    const boss = (await world('COUNTING_FOREST')).levels.at(-1);
    const { summary, last } = await play(boss.id, (i) => i === 0);
    expect(last.boss).toMatchObject({ shields: 0, won: false });
    expect(summary.stars).toBe(0);
    expect(summary.reward).toBeNull();
    expect(summary.boss.practice.levelId).toBeTruthy();
    expect(['COUNTING', 'QUANTITY']).toContain(summary.boss.practice.skillCode);
  });

  it('buys, equips and wears items from the shop', async () => {
    let shop = (await api().get('/shop').set(auth()).expect(200)).body;
    expect(shop.coins).toBeGreaterThanOrEqual(20);
    expect(shop.items.find((i: { code: string }) => i.code === 'OWL').owned).toBe(true);

    const coinsBefore = shop.coins;
    shop = (await api().post('/shop/items/CAP/buy').set(auth()).expect(201)).body;
    expect(shop.coins).toBe(coinsBefore - 20 + 0);
    expect(shop.newAchievements.map((a: { code: string }) => a.code)).toContain('FIRST_PURCHASE');
    await api().post('/shop/items/CAP/buy').set(auth()).expect(400); // already owned
    await api().post('/shop/items/OWL/buy').set(auth()).expect(400); // boss reward only

    await api().post('/character/equip').set(auth()).send({ itemCode: 'CAP', equipped: true }).expect(201);
    await api().post('/character/equip').set(auth()).send({ itemCode: 'OWL', equipped: true }).expect(201);
    await api().post('/character/equip').set(auth()).send({ itemCode: 'CROWN', equipped: true }).expect(400); // not owned
    await api().post('/character/avatar').set(auth()).send({ avatar: '🦊' }).expect(201);

    const look = (await api().get('/character').set(auth()).expect(200)).body;
    expect(look).toMatchObject({ avatar: '🦊', HAT: { code: 'CAP' }, PET: { code: 'OWL' } });
    const dash = (await api().get('/progress/dashboard').set(auth()).expect(200)).body;
    expect(dash.character.HAT.emoji).toBe('🧢');
    expect(dash.stats.bossesDefeated).toBe(1);
  });

  it('never lets coins go negative', async () => {
    await prisma.student.update({ where: { id: studentId }, data: { coins: 10 } });
    await api().post('/shop/items/GRAD_CAP/buy').set(auth()).expect(400);
    expect((await prisma.student.findUniqueOrThrow({ where: { id: studentId } })).coins).toBe(10);
    expect(await prisma.studentItem.count({ where: { studentId, item: { code: 'GRAD_CAP' } } })).toBe(0);
  });
});
