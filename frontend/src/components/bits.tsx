import type { LevelInfo, SkillStatus } from '@/lib/api';

export function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${count} ดาว จาก ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < count ? 'var(--star)' : '#d9d2c5' }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProgressBar({ value, tone }: { value: number; tone?: 'good' | 'warn' | 'bad' }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div className={tone ? `bar ${tone}` : 'bar'} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function XpBar({ xp, level }: { xp: number; level: LevelInfo }) {
  const span = level.nextLevelXp - level.levelStartXp;
  return (
    <div>
      <ProgressBar value={(xp - level.levelStartXp) / span} />
      <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
        ⚡ {xp.toLocaleString()} / {level.nextLevelXp.toLocaleString()} XP
      </div>
    </div>
  );
}

export function masteryTone(mastery: number): 'good' | 'warn' | 'bad' {
  if (mastery >= 0.85) return 'good';
  if (mastery >= 0.6) return 'warn';
  return 'bad';
}

export const STATUS_LABEL: Record<SkillStatus, string> = {
  NOT_STARTED: 'ยังไม่เริ่ม',
  LEARNING: 'กำลังเรียนรู้',
  PRACTICING: 'กำลังฝึก',
  MASTERED: 'เก่งแล้ว',
};

export function Loading({ text = 'กำลังโหลด…' }: { text?: string }) {
  return (
    <div className="page center" style={{ paddingTop: 80 }}>
      <div className="hero">🦉</div>
      <p className="muted">{text}</p>
    </div>
  );
}
