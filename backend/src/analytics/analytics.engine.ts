/**
 * Learning analytics for parents and teachers. Pure functions: easy to test,
 * and nothing here reaches beyond the data it is given.
 */
import { MASTERED_AT } from '../mastery/mastery.engine.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// ───────────── Skill map (✓ △ ✗) ─────────────

export type Cell = '✓' | '△' | '✗' | '·';

/** README's teacher view: ✓ mastered, △ on the way, ✗ struggling, · not started. */
export function skillCell(mastery: number, attempts: number, status: string): Cell {
  if (mastery >= MASTERED_AT) return '✓';
  if (status === 'NOT_STARTED' || (attempts === 0 && mastery === 0)) return '·';
  if (mastery < 0.4) return '✗';
  return '△';
}

// ───────────── Time ─────────────

/** Minutes of thinking time per day for the last `days` days (oldest first). Dates are local YYYY-MM-DD. */
export function dailyMinutes(
  attempts: { createdAt: Date; timeMs: number }[],
  now: Date,
  days = 7,
  tzOffsetMinutes = 7 * 60,
): { date: string; minutes: number }[] {
  const dayKey = (d: Date) => new Date(d.getTime() + tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) buckets.set(dayKey(new Date(now.getTime() - i * DAY_MS)), 0);
  for (const a of attempts) {
    const k = dayKey(a.createdAt);
    if (buckets.has(k)) buckets.set(k, buckets.get(k)! + a.timeMs);
  }
  return [...buckets].map(([date, ms]) => ({ date, minutes: Math.round(ms / 60_000) }));
}

export interface SkillTime {
  skillCode: string;
  nameTh: string;
  timeMs: number;
  attempts: number;
  correct: number;
}

export function timePerSkill(
  attempts: { skillCode: string; timeMs: number; isCorrect: boolean }[],
  names: Map<string, string>,
): SkillTime[] {
  const by = new Map<string, SkillTime>();
  for (const a of attempts) {
    const s = by.get(a.skillCode) ?? { skillCode: a.skillCode, nameTh: names.get(a.skillCode) ?? a.skillCode, timeMs: 0, attempts: 0, correct: 0 };
    s.timeMs += a.timeMs;
    s.attempts += 1;
    if (a.isCorrect) s.correct += 1;
    by.set(a.skillCode, s);
  }
  return [...by.values()].sort((a, b) => b.timeMs - a.timeMs);
}

// ───────────── Parent insights ─────────────

export interface Insight {
  tone: 'good' | 'tip' | 'warn';
  text: string;
}

export interface InsightInput {
  nickname: string;
  week: { date: string; minutes: number }[];
  /** last 14 days, most time first */
  skillTime: SkillTime[];
  recentlyMastered: string[];
  reviewsDue: string[];
  lastActiveAt: Date | null;
  now: Date;
}

/** Data-based tips for parents, in plain Thai. */
export function parentInsights(input: InsightInput): Insight[] {
  const out: Insight[] = [];
  const total = input.week.reduce((s, d) => s + d.minutes, 0);
  const activeDays = input.week.filter((d) => d.minutes > 0).length;

  if (total > 0) {
    out.push({ tone: 'good', text: `สัปดาห์นี้${input.nickname}เรียนไป ${total} นาที ใน ${activeDays} วัน` });
  }
  if (input.recentlyMastered.length) {
    out.push({ tone: 'good', text: `เก่งขึ้นแล้ว: ${input.recentlyMastered.join(', ')} 🎉 ชมเชยน้องได้เลย` });
  }

  // Where the time goes but the answers don't land yet.
  const struggle = input.skillTime.find((s) => s.attempts >= 5 && s.correct / s.attempts < 0.6);
  if (struggle) {
    out.push({
      tone: 'tip',
      text: `${input.nickname}ใช้เวลากับ "${struggle.nameTh}" มาก แต่ตอบถูก ${Math.round((struggle.correct / struggle.attempts) * 100)}% ลองนั่งเล่นด้วยกันสักรอบ หรือใช้ของจริงช่วยอธิบาย`,
    });
  }

  if (input.reviewsDue.length) {
    out.push({ tone: 'tip', text: `มี ${input.reviewsDue.length} ทักษะถึงเวลาทบทวน (${input.reviewsDue.join(', ')}) ชวนเล่น "ทบทวนความจำ" สั้น ๆ` });
  }

  const idleDays = input.lastActiveAt ? Math.floor((input.now.getTime() - input.lastActiveAt.getTime()) / DAY_MS) : null;
  if (idleDays === null) {
    out.push({ tone: 'tip', text: 'ยังไม่ได้เริ่มเล่น ลองเริ่มจากภารกิจวัดพลังสั้น ๆ ด้วยกัน' });
  } else if (idleDays >= 3) {
    out.push({ tone: 'warn', text: `ไม่ได้เล่นมา ${idleDays} วัน เล่นวันละ 10–15 นาทีสม่ำเสมอช่วยให้จำได้ดีกว่าเล่นนาน ๆ ครั้งเดียว` });
  }

  // Healthy screen time: the platform should never push a child to play for hours.
  const longDay = input.week.find((d) => d.minutes > 60);
  if (longDay) {
    out.push({ tone: 'warn', text: `วันที่ ${longDay.date} เล่นไป ${longDay.minutes} นาที อย่าลืมให้น้องพักสายตาทุก 20–30 นาทีนะ` });
  }
  return out;
}

// ───────────── Class analytics ─────────────

export interface StudentSkillRow {
  studentId: string;
  skillCode: string;
  mastery: number;
  attempts: number;
  status: string;
}

/** Skills many students in the class have started but are struggling with. */
export function classWeakSkills(
  rows: StudentSkillRow[],
  names: Map<string, string>,
  minStarted = 2,
): { skillCode: string; nameTh: string; started: number; struggling: number; share: number }[] {
  const by = new Map<string, { started: number; struggling: number }>();
  for (const r of rows) {
    const cell = skillCell(r.mastery, r.attempts, r.status);
    if (cell === '·') continue;
    const s = by.get(r.skillCode) ?? { started: 0, struggling: 0 };
    s.started += 1;
    if (cell === '✗' || (cell === '△' && r.mastery < 0.6)) s.struggling += 1;
    by.set(r.skillCode, s);
  }
  return [...by]
    .filter(([, s]) => s.started >= minStarted && s.struggling > 0)
    .map(([skillCode, s]) => ({
      skillCode,
      nameTh: names.get(skillCode) ?? skillCode,
      ...s,
      share: Math.round((s.struggling / s.started) * 100) / 100,
    }))
    .sort((a, b) => b.share - a.share || b.struggling - a.struggling);
}

export type AssignmentState = 'DONE' | 'LATE' | 'PENDING' | 'OVERDUE';

export function assignmentState(dueAt: Date | null, completedAt: Date | null, now: Date): AssignmentState {
  if (completedAt) return dueAt && completedAt > dueAt ? 'LATE' : 'DONE';
  return dueAt && now > dueAt ? 'OVERDUE' : 'PENDING';
}
