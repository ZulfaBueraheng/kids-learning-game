'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ACTIVITY } from '@/components/ActivityScene';
import { Loading, Stars } from '@/components/bits';
import { Character } from '@/components/Character';
import { SubjectSwitcher } from '@/components/SubjectSwitcher';
import { TopBar } from '@/components/TopBar';
import { api, type Dashboard, type Recommendation, type World } from '@/lib/api';
import { sfx } from '@/lib/sfx';
import { handleApiError, useRequireAuth } from '@/lib/useRequireAuth';

const QUEST_LABEL: Record<Recommendation['kind'], string> = {
  ASSIGNMENT: 'การบ้านจากคุณครู',
  REVIEW: 'ทบทวนความจำ',
  LEARN: 'เรียนต่อ',
  BOSS: 'บอสรออยู่!',
  PRACTICE: 'ฝึกเพิ่ม',
};

function questHref(q: Recommendation): string {
  if (q.levelId) return `/play/${q.levelId}`;
  if (q.assignmentId) return `/play/assignment-${q.assignmentId}`;
  return '/play/review';
}

export default function MapPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [quests, setQuests] = useState<Recommendation[]>([]);
  const [error, setError] = useState('');
  // Bumped when the child switches subject, so the map reloads for that subject.
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (!ready) return;
    Promise.all([api.worlds(), api.dashboard(), api.recommendations()])
      .then(([w, d, r]) => {
        setWorlds(w);
        setDash(d);
        setQuests(r);
      })
      .catch((err) => setError(handleApiError(err, router)));
  }, [ready, router, subject]);

  if (error) return <main className="page"><div className="error">{error}</div></main>;
  if (!worlds || !dash) return <Loading />;

  return (
    <>
      <TopBar student={dash.student} level={dash.level} character={dash.character} />
      <SubjectSwitcher onChange={setSubject} />
      <main className="page stack">
        {!dash.placementDone && (
          <div className="card row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3>🧭 ทำภารกิจวัดพลังก่อนนะ</h3>
              <p className="muted" style={{ margin: 0 }}>
                เพื่อให้เราเลือกด่านที่เหมาะกับหนูที่สุด
              </p>
            </div>
            <Link className="btn" href="/placement">
              เริ่มภารกิจ
            </Link>
          </div>
        )}

        {quests.length > 0 && (
          <section className="stack" style={{ gap: 10 }}>
            <h2>🎯 ภารกิจวันนี้</h2>
            <div className="quests">
              {quests.map((q, i) => (
                <Link
                  key={`${q.kind}-${q.levelId ?? q.assignmentId ?? 'review'}`}
                  href={questHref(q)}
                  onClick={() => sfx.tap()}
                  className={`quest ${q.kind.toLowerCase()}${i === 0 ? ' first' : ''}`}
                >
                  <span className="quest-emoji">{q.emoji}</span>
                  <span className={q.kind === 'BOSS' ? 'badge boss' : 'badge'}>{QUEST_LABEL[q.kind]}</span>
                  <strong>{q.title}</strong>
                  <span className="muted">{q.reason}</span>
                  <span className="btn" style={{ marginTop: 'auto' }}>
                    {q.kind === 'BOSS' ? 'ท้าสู้ ⚔️' : 'เล่นเลย ▶'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {worlds.map((world) => (
          <section key={world.id} className={`world ${world.theme}${world.unlocked ? '' : ' locked'}`}>
            <div className="world-head">
              <span className="emoji">{world.emoji}</span>
              <div>
                <h2>{world.nameTh}</h2>
                <div className="muted">
                  {world.name} · ⭐ {world.stars}/{world.maxStars}
                </div>
              </div>
            </div>
            <div className="stages">
              {world.levels.map((level, i) => {
                const body = level.isBoss ? (
                  <>
                    <span className="icon">{level.unlocked ? level.bossEmoji : '💤'}</span>
                    <span className="name">บอส: {level.name}</span>
                    <span className="skill">{level.unlocked ? 'รวมทุกทักษะ' : 'ผ่านทุกด่านเพื่อปลุกบอส'}</span>
                    {level.unlocked && (level.stars > 0 ? <span className="badge">ปราบแล้ว ✓</span> : <span className="badge boss">ท้าสู้!</span>)}
                  </>
                ) : (
                  <>
                    <span className="icon">{level.unlocked ? ACTIVITY[level.activity].emoji : '🔒'}</span>
                    <span className="name">
                      ด่าน {i + 1}: {level.name}
                    </span>
                    <span className="skill">{level.skillNameTh}</span>
                    {level.unlocked && <Stars count={level.stars} />}
                    {level.recommended && level.unlocked && (
                      <span className="you-here" aria-label="ด่านที่แนะนำ">
                        <Character look={dash.character} size={20} />
                        <span className="you-label">หนูอยู่นี่!</span>
                      </span>
                    )}
                  </>
                );
                const awake = level.isBoss && level.unlocked && level.stars === 0;
                const cls = `stage${level.isBoss ? ' boss' : ''}${awake ? ' awake' : ''}${level.recommended ? ' recommended' : ''}${level.unlocked ? '' : ' locked'}`;
                const pop = { ['--i' as string]: i };
                return level.unlocked ? (
                  <Link key={level.id} href={`/play/${level.id}`} className={cls} style={pop} onClick={() => sfx.tap()}>
                    {body}
                  </Link>
                ) : (
                  <div key={level.id} className={cls} style={pop} aria-disabled>
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
