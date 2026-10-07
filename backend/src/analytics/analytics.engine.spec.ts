import {
  assignmentState,
  classWeakSkills,
  dailyMinutes,
  parentInsights,
  skillCell,
  timePerSkill,
  type InsightInput,
} from './analytics.engine.js';

const NOW = new Date('2026-06-10T05:00:00Z'); // 12:00 in Bangkok
const DAY = 24 * 60 * 60 * 1000;

describe('analytics engine', () => {
  it('maps mastery to the teacher skill map symbols', () => {
    expect(skillCell(0.9, 10, 'MASTERED')).toBe('✓');
    expect(skillCell(0.65, 10, 'PRACTICING')).toBe('△');
    expect(skillCell(0.2, 10, 'LEARNING')).toBe('✗');
    expect(skillCell(0, 0, 'NOT_STARTED')).toBe('·');
  });

  it('buckets thinking time into local days', () => {
    const week = dailyMinutes(
      [
        { createdAt: new Date(NOW.getTime() - 60_000), timeMs: 5 * 60_000 },
        { createdAt: new Date(NOW.getTime() - DAY), timeMs: 3 * 60_000 },
        { createdAt: new Date(NOW.getTime() - 30 * DAY), timeMs: 99 * 60_000 }, // outside the window
        // 23:30 UTC on 9 June is already 10 June in Bangkok
        { createdAt: new Date('2026-06-09T18:30:00Z'), timeMs: 2 * 60_000 },
      ],
      NOW,
    );
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toEqual({ date: '2026-06-10', minutes: 7 });
    expect(week.at(-2)).toEqual({ date: '2026-06-09', minutes: 3 });
  });

  it('sums time and accuracy per skill, most time first', () => {
    const names = new Map([['ADD', 'บวก'], ['SUB', 'ลบ']]);
    const t = timePerSkill(
      [
        { skillCode: 'ADD', timeMs: 1000, isCorrect: true },
        { skillCode: 'SUB', timeMs: 5000, isCorrect: false },
        { skillCode: 'SUB', timeMs: 5000, isCorrect: true },
      ],
      names,
    );
    expect(t[0]).toEqual({ skillCode: 'SUB', nameTh: 'ลบ', timeMs: 10000, attempts: 2, correct: 1 });
  });

  describe('parent insights', () => {
    const base: InsightInput = {
      nickname: 'มะลิ',
      week: [
        { date: '2026-06-04', minutes: 0 },
        { date: '2026-06-05', minutes: 12 },
        { date: '2026-06-06', minutes: 0 },
        { date: '2026-06-07', minutes: 15 },
        { date: '2026-06-08', minutes: 0 },
        { date: '2026-06-09', minutes: 0 },
        { date: '2026-06-10', minutes: 10 },
      ],
      skillTime: [],
      recentlyMastered: [],
      reviewsDue: [],
      lastActiveAt: NOW,
      now: NOW,
    };

    it('summarises the week', () => {
      expect(parentInsights(base)[0]).toEqual({ tone: 'good', text: 'สัปดาห์นี้มะลิเรียนไป 37 นาที ใน 3 วัน' });
    });

    it('points out where time goes but answers do not land', () => {
      const tips = parentInsights({
        ...base,
        skillTime: [{ skillCode: 'SUB', nameTh: 'ลบเลขหลักเดียว', timeMs: 600_000, attempts: 10, correct: 4 }],
      });
      expect(tips.some((t) => t.tone === 'tip' && t.text.includes('ลบเลขหลักเดียว') && t.text.includes('40%'))).toBe(true);
    });

    it('nudges after a few idle days and warns about very long days', () => {
      const idle = parentInsights({ ...base, lastActiveAt: new Date(NOW.getTime() - 4 * DAY) });
      expect(idle.some((t) => t.tone === 'warn' && t.text.includes('4 วัน'))).toBe(true);
      const long = parentInsights({ ...base, week: [...base.week.slice(0, 6), { date: '2026-06-10', minutes: 95 }] });
      expect(long.some((t) => t.tone === 'warn' && t.text.includes('95 นาที'))).toBe(true);
    });

    it('celebrates new mastery and mentions due reviews', () => {
      const tips = parentInsights({ ...base, recentlyMastered: ['การนับ'], reviewsDue: ['บวกเลขหลักเดียว'] });
      expect(tips.map((t) => t.text).join(' ')).toContain('การนับ');
      expect(tips.map((t) => t.text).join(' ')).toContain('ทบทวน');
    });

    it('suggests a first step for a child who has not played yet', () => {
      const tips = parentInsights({ ...base, week: base.week.map((d) => ({ ...d, minutes: 0 })), lastActiveAt: null });
      expect(tips).toEqual([{ tone: 'tip', text: 'ยังไม่ได้เริ่มเล่น ลองเริ่มจากภารกิจวัดพลังสั้น ๆ ด้วยกัน' }]);
    });
  });

  it('finds skills most of the class struggles with', () => {
    const names = new Map([['ADD', 'บวก'], ['SUB', 'ลบ'], ['MUL', 'คูณ']]);
    const rows = [
      { studentId: 'a', skillCode: 'ADD', mastery: 0.9, attempts: 10, status: 'MASTERED' },
      { studentId: 'b', skillCode: 'ADD', mastery: 0.9, attempts: 10, status: 'MASTERED' },
      { studentId: 'a', skillCode: 'SUB', mastery: 0.3, attempts: 10, status: 'LEARNING' },
      { studentId: 'b', skillCode: 'SUB', mastery: 0.5, attempts: 10, status: 'LEARNING' },
      { studentId: 'c', skillCode: 'SUB', mastery: 0.9, attempts: 10, status: 'MASTERED' },
      { studentId: 'a', skillCode: 'MUL', mastery: 0.2, attempts: 3, status: 'LEARNING' }, // only 1 student started
    ];
    expect(classWeakSkills(rows, names)).toEqual([{ skillCode: 'SUB', nameTh: 'ลบ', started: 3, struggling: 2, share: 0.67 }]);
  });

  it('tracks assignment state', () => {
    const due = new Date(NOW.getTime() + DAY);
    expect(assignmentState(due, null, NOW)).toBe('PENDING');
    expect(assignmentState(due, NOW, NOW)).toBe('DONE');
    expect(assignmentState(due, new Date(due.getTime() + 1), NOW)).toBe('LATE');
    expect(assignmentState(new Date(NOW.getTime() - DAY), null, NOW)).toBe('OVERDUE');
    expect(assignmentState(null, null, NOW)).toBe('PENDING');
  });
});
