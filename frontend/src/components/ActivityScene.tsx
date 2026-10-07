import type { Activity, BossState } from '@/lib/api';

export const ACTIVITY: Record<Activity, { emoji: string; label: string; goal: string; result: (n: number, total: number) => string }> = {
  TARGET: { emoji: '🎯', label: 'ยิงเป้า', goal: 'ตอบถูกเพื่อยิงเป้าให้โดน!', result: (n, t) => `ยิงโดน ${n} จาก ${t} เป้า!` },
  BUILDING: { emoji: '🧱', label: 'สร้างหอคอย', goal: 'ตอบถูกเพื่อรับบล็อกมาสร้างหอคอย!', result: (n) => `สร้างหอคอยสูง ${n} ชั้น!` },
  TRAIN: { emoji: '🚂', label: 'รถไฟ', goal: 'ตอบถูกเพื่อพารถไฟไปถึงสถานี!', result: (n, t) => `รถไฟวิ่งได้ ${n} จาก ${t} ช่วง!` },
  FISHING: { emoji: '🎣', label: 'ตกปลา', goal: 'ตอบถูกเพื่อตกปลาให้ได้เยอะ ๆ!', result: (n) => `ตกปลาได้ ${n} ตัว!` },
  RACING: { emoji: '🏎️', label: 'แข่งรถ', goal: 'ตอบถูกเพื่อเร่งความเร็วเข้าเส้นชัย!', result: (n) => `เร่งเครื่องได้ ${n} ครั้ง!` },
  PUZZLE: { emoji: '🧩', label: 'จิ๊กซอว์', goal: 'ตอบถูกเพื่อเปิดภาพปริศนาทีละชิ้น!', result: (n, t) => `เปิดภาพปริศนาได้ ${n} จาก ${t} ชิ้น!` },
  SHOP: { emoji: '🛍️', label: 'ร้านค้า', goal: 'คิดเงินให้ถูก แล้วรับเหรียญจากลูกค้า!', result: (n) => `ลูกค้าพอใจ ${n} คน!` },
  MAGIC: { emoji: '🧪', label: 'ปรุงยาวิเศษ', goal: 'ตอบถูกเพื่อเติมส่วนผสมลงในหม้อวิเศษ!', result: (n) => `ใส่ส่วนผสมวิเศษได้ ${n} อย่าง!` },
  MINING: { emoji: '⛏️', label: 'ขุดแร่', goal: 'ตอบถูกเพื่อขุดบล็อกให้แตก แล้วเก็บแร่ล้ำค่า!', result: (n) => `ขุดได้แร่ล้ำค่า ${n} ก้อน!` },
  BOSS: { emoji: '⚔️', label: 'ต่อสู้บอส', goal: 'ตอบถูก 5 ครั้งเพื่อปราบบอส! หนูมีโล่ 3 อัน', result: (n) => `โจมตีบอสโดน ${n} ครั้ง!` },
};

const PUZZLE_PICTURES = ['🦄', '🐉', '🚀', '🏰', '🌈', '🦖'];
const ORES = ['💎', '🪙', '🔶', '💚', '🔮'];

/**
 * The game layer: same questions, but each correct answer moves the activity forward.
 * The newest piece (index correct − 1) gets a little animation so every answer "does" something.
 */
export function ActivityScene({ activity, correct, total, seed = 0 }: { activity: Activity; correct: number; total: number; seed?: number }) {
  const progress = total ? correct / total : 0;
  const done = correct >= total;
  const fresh = (i: number) => (i === correct - 1 ? 'fresh' : undefined);
  switch (activity) {
    case 'TARGET':
      return (
        <div className="scene" aria-label={`ยิงโดน ${correct} จาก ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < correct ? `boom ${fresh(i) ?? ''}` : 'target'}>
              {i < correct ? '💥' : '🎯'}
            </span>
          ))}
          {correct > 0 && (
            <span key={`dart-${correct}`} className="dart" style={{ left: `${16 + ((correct - 1) / Math.max(total, 1)) * 70}%` }} aria-hidden>
              🏹
            </span>
          )}
        </div>
      );
    case 'FISHING':
      return (
        <div className="scene" aria-label={`ตกปลาได้ ${correct} ตัว`}>
          <span className={correct > 0 ? 'rod' : undefined} key={`rod-${correct}`}>
            🎣
          </span>
          <span>🪣</span>
          {Array.from({ length: correct }, (_, i) => (
            <span key={i} className={fresh(i) && 'fish-jump'}>
              {['🐠', '🐟', '🐡'][i % 3]}
            </span>
          ))}
          <span className="waves" style={{ marginLeft: 'auto' }}>
            🌊🌊
          </span>
        </div>
      );
    case 'BUILDING':
      return (
        <div className="scene" aria-label={`ได้บล็อก ${correct} ก้อน`}>
          <div className="tower">
            {Array.from({ length: correct }, (_, i) => (
              <span key={i} className={fresh(i) && 'drop'} style={{ fontSize: 22 }}>
                🧱
              </span>
            ))}
          </div>
          {done ? <span className="celebrate">🏰</span> : <span style={{ opacity: 0.35 }}>🏗️</span>}
        </div>
      );
    case 'TRAIN':
    case 'RACING': {
      const mover = activity === 'TRAIN' ? '🚂' : '🏎️';
      const goal = activity === 'TRAIN' ? '🚉' : '🏁';
      const left = 6 + progress * 82;
      return (
        <div className="scene" aria-label={`ไปได้ ${Math.round(progress * 100)}%`}>
          <div className="track">
            {correct > 0 && (
              <span key={`puff-${correct}`} className="puff" style={{ left: `${left - 8}%` }} aria-hidden>
                {activity === 'TRAIN' ? '☁️' : '💨'}
              </span>
            )}
            <span key={`mover-${correct}`} className={correct > 0 ? 'mover zoom' : 'mover'} style={{ left: `${left}%` }}>
              {mover}
            </span>
          </div>
          <span className={done ? 'celebrate' : undefined}>{goal}</span>
        </div>
      );
    }
    case 'PUZZLE': {
      const picture = PUZZLE_PICTURES[seed % PUZZLE_PICTURES.length];
      return (
        <div className="scene" aria-label={`เปิดภาพได้ ${correct} จาก ${total} ชิ้น`}>
          <div className="puzzle">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < correct ? `open ${fresh(i) ? 'flip' : ''}` : undefined}>
                {i < correct ? picture : '🧩'}
              </span>
            ))}
          </div>
          {done && <span className="celebrate" style={{ fontSize: 44 }}>{picture}</span>}
        </div>
      );
    }
    case 'SHOP':
      return (
        <div className="scene" aria-label={`ได้เหรียญ ${correct} เหรียญ`}>
          <span>🏪</span>
          <span>🧺</span>
          {Array.from({ length: correct }, (_, i) => (
            <span key={i} className={fresh(i) && 'coin-in'}>
              🪙
            </span>
          ))}
          <span key={`face-${correct}`} className={correct > 0 ? 'happy' : undefined} style={{ marginLeft: 'auto' }}>
            {done ? '😄' : correct > 0 ? '😊' : '🙂'}
          </span>
        </div>
      );
    case 'MAGIC':
      return (
        <div className="scene" aria-label={`ส่วนผสม ${correct} จาก ${total}`}>
          <span>🧙</span>
          <div className="cauldron">
            <span className="fill" style={{ height: `${progress * 100}%` }} />
            <span className="pot">⚗️</span>
            {correct > 0 && (
              <span key={`bubble-${correct}`} className="bubbles" aria-hidden>
                🫧
              </span>
            )}
          </div>
          <span>{'✨'.repeat(Math.max(correct, 0))}</span>
          {done && <span className="celebrate">🌟</span>}
        </div>
      );
    case 'MINING':
      return (
        <div className="scene mine-scene" aria-label={`ขุดได้ ${correct} จาก ${total} บล็อก`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < correct ? `block mined ${fresh(i) ? 'breaking' : ''}` : `block ${i % 2 ? 'stone' : 'dirt'}`}>
              {i < correct && <span className="ore">{ORES[(i + seed) % ORES.length]}</span>}
            </span>
          ))}
          {correct > 0 && (
            <span key={`pick-${correct}`} className="pickaxe" style={{ left: `${10 + ((correct - 1) / Math.max(total, 1)) * 76}%` }} aria-hidden>
              ⛏️
            </span>
          )}
          {done && <span className="celebrate" style={{ marginLeft: 'auto' }}>🏆</span>}
        </div>
      );
    case 'BOSS':
      return null;
  }
}

export function BossScene({ emoji, name, boss, hit }: { emoji: string; name: string; boss: BossState; hit: 'boss' | 'child' | null }) {
  return (
    <div className="boss-scene">
      <div className={`boss-sprite${hit === 'boss' ? ' hit' : ''}${boss.won ? ' defeated' : ''}`}>{emoji}</div>
      <div className="boss-name">{name}</div>
      <div className="row" style={{ justifyContent: 'center', gap: 4 }} aria-label={`พลังบอส ${boss.hp} จาก ${boss.maxHp}`}>
        {Array.from({ length: boss.maxHp }, (_, i) => (
          <span key={i} style={{ opacity: i < boss.hp ? 1 : 0.2 }}>
            ❤️
          </span>
        ))}
      </div>
      <div className={`row${hit === 'child' ? ' shake' : ''}`} style={{ justifyContent: 'center', gap: 4 }} aria-label={`โล่ของหนู ${boss.shields} จาก ${boss.maxShields}`}>
        <span className="muted" style={{ fontSize: 14 }}>
          โล่ของหนู
        </span>
        {Array.from({ length: boss.maxShields }, (_, i) => (
          <span key={i} style={{ opacity: i < boss.shields ? 1 : 0.2 }}>
            🛡️
          </span>
        ))}
      </div>
    </div>
  );
}
