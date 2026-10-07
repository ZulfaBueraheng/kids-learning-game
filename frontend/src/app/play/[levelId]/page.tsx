'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { ACTIVITY, ActivityScene, BossScene } from '@/components/ActivityScene';
import { Loading, ProgressBar, Stars, masteryTone } from '@/components/bits';
import { MathText } from '@/components/MathText';
import { QuestionCard, type Feedback } from '@/components/QuestionCard';
import {
  api,
  type BossState,
  type Level,
  type Question,
  type SessionStart,
  type SessionSummary,
  type World,
  THEMES,
} from '@/lib/api';
import { readSoundOn, sfx, writeSoundOn } from '@/lib/sfx';
import { handleApiError, useRequireAuth } from '@/lib/useRequireAuth';

const CHEERS = ['เยี่ยมมาก! 🌟', 'เก่งสุด ๆ! 🎉', 'ถูกต้อง! ✨', 'สุดยอด! 🚀'];
const BOSS_HITS = ['โจมตีโดนเต็ม ๆ! 💥', 'บอสเริ่มอ่อนแรงแล้ว! ⚡', 'ปัง! 💫'];

export default function PlayPage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = use(params);
  // Fresh state for every stage, e.g. when jumping from a boss to a practice stage.
  return <Play key={levelId} levelId={levelId} />;
}

/** A spaced-review session isn't a stage on the map; this is how it is shown before it starts. */
const REVIEW_PREVIEW: { level: Level; world: World } = {
  level: {
    id: 'review',
    name: 'ทบทวนความจำ',
    activity: 'MAGIC',
    difficulty: 2,
    questionCount: 6,
    isBoss: false,
    bossEmoji: null,
    skillCode: '',
    skillCodes: [],
    skillNameTh: 'ทักษะที่ถึงเวลาทบทวน',
    stars: 0,
    unlocked: true,
    recommended: false,
  },
  world: {
    id: 'review',
    code: 'REVIEW',
    name: 'Review',
    nameTh: 'ห้องทบทวนความจำ',
    emoji: '🔁',
    theme: 'review',
    unlocked: true,
    stars: 0,
    maxStars: 0,
    levels: [],
  },
};

/** Homework from the teacher: also not a map stage. Details arrive when the session starts. */
const ASSIGNMENT_PREVIEW: { level: Level; world: World } = {
  level: { ...REVIEW_PREVIEW.level, id: 'assignment', name: 'การบ้านจากคุณครู', activity: 'TARGET', skillNameTh: 'ทักษะที่คุณครูมอบหมาย' },
  world: { ...REVIEW_PREVIEW.world, id: 'assignment', code: 'ASSIGNMENT', nameTh: 'การบ้าน', emoji: '📚', theme: 'assignment' },
};

function Play({ levelId }: { levelId: string }) {
  const ready = useRequireAuth();
  const router = useRouter();
  const assignmentId = levelId.startsWith('assignment-') ? levelId.slice('assignment-'.length) : null;
  const isReview = levelId === 'review';
  const special = isReview || !!assignmentId;

  const [preview, setPreview] = useState<{ level: Level; world: World } | null>(() =>
    isReview ? REVIEW_PREVIEW : assignmentId ? ASSIGNMENT_PREVIEW : null,
  );
  const [support, setSupport] = useState(false);
  const [session, setSession] = useState<SessionStart | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [boss, setBoss] = useState<BossState | null>(null);
  const [hit, setHit] = useState<'boss' | 'child' | null>(null);
  const [feedback, setFeedback] = useState<(Feedback & { hint: string | null }) | null>(null);
  const [pending, setPending] = useState<{ question: Question | null; summary: SessionSummary | null } | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Correct answers in a row. Only ever celebrated — a mistake just quietly resets it.
  const [combo, setCombo] = useState(0);
  // 3 → 2 → 1 → 0 ("ไป!") → null (playing)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(readSoundOn);

  useEffect(() => {
    if (countdown === null) return;
    sfx.countdown(countdown === 0);
    const t = setTimeout(() => setCountdown((c) => (c === null || c === 0 ? null : c - 1)), countdown === 0 ? 550 : 700);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!ready || special) return;
    api
      .worlds()
      .then((worlds) => {
        for (const world of worlds) {
          const level = world.levels.find((l) => l.id === levelId);
          if (level) return setPreview({ level, world });
        }
        setError('ไม่พบด่านนี้');
      })
      .catch((err) => setError(handleApiError(err, router)));
  }, [ready, levelId, special, router]);

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = assignmentId
        ? await api.startAssignment(assignmentId)
        : isReview
          ? await api.startReview()
          : await api.startLevel(levelId);
      if (special) {
        const base = assignmentId ? ASSIGNMENT_PREVIEW : REVIEW_PREVIEW;
        setPreview({ level: { ...base.level, ...res.level }, world: { ...base.world, ...res.level.world } });
      }
      setSession(res);
      setSupport(false);
      setQuestion(res.question);
      setBoss(res.boss);
      setIndex(0);
      setCorrect(0);
      setCombo(0);
      setCountdown(3);
      setSummary(null);
    } catch (err) {
      setError(handleApiError(err, router));
    } finally {
      setBusy(false);
    }
  };

  const advance = (next: { question: Question | null; summary: SessionSummary | null }) => {
    setFeedback(null);
    setPending(null);
    setHit(null);
    setQuestion(next.question);
    if (next.summary) setSummary(next.summary);
  };

  const answer = async (chosen: string, timeMs: number, hintUsed: boolean) => {
    if (!session || !question) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.answerLevel(session.sessionId, { questionId: question.id, answer: chosen, timeMs, hintUsed });
      setFeedback({ chosen, isCorrect: res.isCorrect, correctAnswer: res.correctAnswer, hint: res.hint });
      setSupport(res.support);
      setIndex(res.index);
      if (res.isCorrect) {
        setCorrect((c) => c + 1);
        setCombo(combo + 1);
        if (res.boss) sfx.hit();
        else sfx.correct(combo + 1);
      } else {
        setCombo(0);
        sfx.wrong();
      }
      if (res.boss) {
        setBoss(res.boss);
        setHit(res.isCorrect ? 'boss' : 'child');
      }
      const next = { question: res.question, summary: res.summary };
      // Correct answers move on by themselves; after a mistake the child reads
      // the explanation and continues when ready.
      if (res.isCorrect) setTimeout(() => advance(next), res.boss ? 1100 : 900);
      else setPending(next);
    } catch (err) {
      setError(handleApiError(err, router));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;
  if (error && !session) {
    return (
      <main className="page stack" style={{ maxWidth: 560 }}>
        <div className="error">{error}</div>
        <Link className="btn secondary" href="/map">
          กลับแผนที่
        </Link>
      </main>
    );
  }
  if (!preview) return <Loading />;

  const { level, world } = preview;
  const activity = ACTIVITY[level.activity];

  if (summary) return <Summary key={session?.sessionId} summary={summary} level={level} onReplay={start} busy={busy} />;

  if (!session || !question) {
    return (
      <main className="page stack" style={{ maxWidth: 560, paddingTop: 32 }}>
        <div className={`world ${world.theme} center stack`}>
          <div>
            <span className="hero">{level.isBoss ? level.bossEmoji : activity.emoji}</span>
          </div>
          <div className="muted">
            {world.emoji} {world.nameTh}
          </div>
          <h1>{level.isBoss ? `บอส: ${level.name}` : level.name}</h1>
          <div>
            <span className={level.isBoss ? 'badge boss' : 'badge'}>{activity.label}</span> · {level.skillNameTh}
          </div>
          <p style={{ margin: 0 }}>{activity.goal}</p>
          <p className="muted" style={{ margin: 0 }}>
            {level.isBoss ? 'โจทย์ผสมจากทุกด่านในโลกนี้' : `${level.questionCount} ข้อ`} · ดาวที่ดีที่สุด <Stars count={level.stars} />
          </p>
          {error && <div className="error">{error}</div>}
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn secondary" href="/map">
              กลับ
            </Link>
            <button className="btn big" onClick={start} disabled={busy || !level.unlocked}>
              {!level.unlocked ? '🔒 ยังไม่ปลดล็อก' : level.isBoss ? 'ท้าสู้! ⚔️' : 'เริ่มเล่น ▶'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page stack" style={{ maxWidth: 680 }}>
      <div className={`world ${world.theme} stack`} style={{ padding: 14, gap: 10 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>
            {world.emoji} {level.name}{' '}
            {session.theme !== 'GENERAL' && (
              <span className="badge theme" title="ธีมตามความชอบของหนู">
                {THEMES[session.theme].emoji} {THEMES[session.theme].label}
              </span>
            )}
          </strong>
          <span className="row" style={{ gap: 8 }}>
            {combo >= 2 && (
              <span key={combo} className="combo">
                🔥 คอมโบ x{combo}
              </span>
            )}
            <button
              type="button"
              className="sound-toggle"
              onClick={() => {
                writeSoundOn(!soundOn);
                setSoundOn(!soundOn);
              }}
              aria-label={soundOn ? 'ปิดเสียงเกม' : 'เปิดเสียงเกม'}
              title={soundOn ? 'ปิดเสียงเกม' : 'เปิดเสียงเกม'}
            >
              {soundOn ? '🎵' : '🔇'}
            </button>
          </span>
        </div>
        <div className="play-scene">
          {boss ? (
            <BossScene emoji={level.bossEmoji ?? '👾'} name={level.name} boss={boss} hit={hit} />
          ) : (
            <ActivityScene activity={level.activity} correct={correct} total={session.total} seed={level.name.length} />
          )}
          {feedback?.isCorrect && (
            <span key={index} className="float-plus" aria-hidden>
              {boss ? '💥' : '+1 ⭐'}
            </span>
          )}
        </div>
        {!boss && (
          <div className="journey" aria-label={`ผ่านมาแล้ว ${index} จาก ${session.total}`}>
            {Array.from({ length: session.total }, (_, i) => (
              <span key={i} className={i < index ? 'done' : i === index && !feedback ? 'now' : undefined} />
            ))}
          </div>
        )}
      </div>

      {countdown !== null ? (
        <div className="card countdown" aria-live="assertive">
          <span key={countdown} className={countdown === 0 ? 'go' : undefined}>
            {countdown === 0 ? 'ไป! 🚀' : countdown}
          </span>
        </div>
      ) : (
        <>
          <div className="card">
            <QuestionCard
              key={question.id}
              question={question}
              feedback={feedback}
              busy={busy}
              autoHint={support && !feedback}
              onAnswer={answer}
            />
          </div>

          <div className="center stack" style={{ minHeight: 48, gap: 10 }}>
            {feedback?.isCorrect && <div className="feedback good">{(boss ? BOSS_HITS : CHEERS)[index % 3]}</div>}
            {feedback && !feedback.isCorrect && (
              <>
                <div className="feedback bad">
                  {boss ? 'บอสสวนกลับ! โล่หายไป 1 อัน · ' : 'เกือบแล้ว! '}คำตอบคือ <MathText text={feedback.correctAnswer ?? ''} />
                </div>
                {feedback.hint && <div className="hint" style={{ margin: '0 auto' }}>💡 {feedback.hint}</div>}
                {support && <div className="muted">ไม่เป็นไรนะ 🤗 ข้อต่อไปง่ายขึ้นนิดนึง และมีคำใบ้ให้ด้วย</div>}
                {pending && (
                  <button className="btn" style={{ alignSelf: 'center' }} onClick={() => advance(pending)} autoFocus>
                    ไปต่อ ▶
                  </button>
                )}
              </>
            )}
            {error && <div className="error">{error}</div>}
          </div>
        </>
      )}
    </main>
  );
}

function Summary({ summary, level, onReplay, busy }: { summary: SessionSummary; level: Level; onReplay: () => void; busy: boolean }) {
  const passed = summary.stars >= 1;
  const boss = summary.boss;
  const title = boss ? (boss.won ? 'ปราบบอสสำเร็จ!' : 'บอสยังแข็งแรงอยู่!') : passed ? 'ผ่านด่านแล้ว!' : 'เกือบแล้ว ลองอีกครั้งนะ!';
  const hero = boss ? (boss.won ? '🏆' : (level.bossEmoji ?? '👾')) : passed ? '🏆' : '🌱';
  const won = boss ? boss.won : passed;
  const coins = useCountUp(summary.coinsEarned, 1000);

  // Fanfare, then each star chimes in as it pops onto the screen.
  useEffect(() => {
    if (won) sfx.win();
    else sfx.tryAgain();
    const timers = Array.from({ length: summary.stars }, (_, i) => setTimeout(() => sfx.star(i), 500 + i * 350));
    return () => timers.forEach(clearTimeout);
  }, [won, summary.stars]);

  return (
    <main className="page stack" style={{ maxWidth: 560, paddingTop: 32 }}>
      {won && <Confetti />}
      <div className="card center stack">
        <div>
          <span className="hero">{hero}</span>
        </div>
        <h1>{title}</h1>
        <div aria-label={`${summary.stars} ดาว จาก 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < summary.stars ? 'star-pop on' : 'star-pop'} style={{ animationDelay: `${0.5 + i * 0.35}s` }}>
              ★
            </span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{ACTIVITY[boss ? 'BOSS' : level.activity].result(summary.correct, summary.total)}</p>
        <p style={{ margin: 0 }}>
          <strong>+{summary.xpEarned} XP</strong> · <strong>+{coins} 🪙</strong>
        </p>
        {summary.leveledUp && <div className="feedback good">🎉 เลเวลอัป! ตอนนี้เลเวล {summary.level.level}</div>}
      </div>

      {summary.reward && (
        <div className="card row reward">
          <span style={{ fontSize: 56 }}>{summary.reward.emoji}</span>
          <div>
            <div className="badge">ของสะสมจากบอส</div>
            <h3 style={{ marginTop: 4 }}>{summary.reward.name}</h3>
            <div className="muted">ไปแต่งตัวละครได้ที่ร้านค้า</div>
          </div>
        </div>
      )}

      {boss && !boss.won && boss.practice && (
        <div className="card stack">
          <h3>💪 ไปฝึกเพิ่มพลังก่อนนะ</h3>
          <p style={{ margin: 0 }}>
            ข้อที่ยากที่สุดสำหรับหนูคือ <strong>{boss.practice.skillNameTh}</strong> ลองฝึกด่านนี้ แล้วกลับมาสู้ใหม่!
          </p>
          <Link className="btn" href={`/play/${boss.practice.levelId}`} style={{ alignSelf: 'flex-start' }}>
            ฝึก “{boss.practice.levelName}” ▶
          </Link>
        </div>
      )}

      {(summary.unlocked.worlds.length > 0 || summary.unlocked.levels.length > 0) && (
        <div className="card stack">
          <h3>🔓 ปลดล็อกใหม่!</h3>
          {summary.unlocked.worlds.map((w) => (
            <div key={w.code} className="feedback good" style={{ fontSize: 20 }}>
              {w.emoji} โลกใหม่: {w.nameTh}
            </div>
          ))}
          {summary.unlocked.levels.map((l) => (
            <div key={l.id}>
              {l.isBoss ? `${l.bossEmoji} บอสตื่นแล้ว: ` : `${l.worldEmoji} `}
              {l.name} <span className="muted">({l.worldNameTh})</span>
            </div>
          ))}
        </div>
      )}

      <div className="card stack">
        <h3>⚡ พลังที่หนูได้รอบนี้</h3>
        {summary.skills.map((s) => (
          <div key={s.code} className="stack" style={{ gap: 4 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{s.nameTh}</strong>
              <span className="muted">
                {s.after > s.before && <strong style={{ color: 'var(--good)' }}>+{Math.round((s.after - s.before) * 100)} พลัง </strong>}
                {s.status === 'MASTERED' && '🏅 เก่งแล้ว!'}
              </span>
            </div>
            <ProgressBar value={s.after} tone={masteryTone(s.after)} />
          </div>
        ))}
      </div>

      {summary.newAchievements.length > 0 && (
        <div className="card stack">
          <h3>รางวัลใหม่!</h3>
          {summary.newAchievements.map((a) => (
            <div key={a.code} className="row">
              <span style={{ fontSize: 40 }}>{a.emoji}</span>
              <div>
                <strong>{a.name}</strong>
                <div className="muted">
                  {a.description}
                  {a.xpReward > 0 && ` · +${a.xpReward} XP`}
                  {!!a.coinReward && ` · +${a.coinReward} 🪙`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn secondary" onClick={onReplay} disabled={busy}>
          🔁 {boss && !boss.won ? 'สู้อีกครั้ง' : 'เล่นอีกครั้ง'}
        </button>
        <Link className="btn big" href="/map">
          กลับแผนที่ 🌎
        </Link>
      </div>
    </main>
  );
}

/** Counts up from 0 so earned coins "pour in". */
function useCountUp(target: number, ms: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    const steps = Math.min(target, 20);
    let step = 0;
    const t = setInterval(() => {
      step++;
      setValue(Math.round((target * step) / steps));
      if (step % 2 === 0) sfx.coin();
      if (step >= steps) clearInterval(t);
    }, ms / steps);
    return () => clearInterval(t);
  }, [target, ms]);
  return value;
}

const CONFETTI_COLORS = ['#ff5e62', '#ffc531', '#20b26b', '#6c5ce7', '#2fb6f0', '#ff8ac6'];

function Confetti() {
  // Fixed layout per render of the summary; Math.random is fine here, it is only decoration.
  const [pieces] = useState(() =>
    Array.from({ length: 48 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    })),
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
