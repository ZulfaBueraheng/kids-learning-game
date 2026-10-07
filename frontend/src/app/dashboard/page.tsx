'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loading, ProgressBar, STATUS_LABEL, masteryTone } from '@/components/bits';
import { Character } from '@/components/Character';
import { ClassroomCard } from '@/components/ClassroomCard';
import { TopBar } from '@/components/TopBar';
import { InterestPicker } from '@/components/InterestPicker';
import { api, GOALS, SUBJECT_META, THEMES, tokenStore, type Dashboard, type Goal, type InterestTheme, type Student } from '@/lib/api';
import { SubjectSwitcher } from '@/components/SubjectSwitcher';
import { handleApiError, useRequireAuth } from '@/lib/useRequireAuth';

const GROUP_LABEL: Record<string, string> = {
  NUMBER_SENSE: '🔢 ความรู้สึกเชิงจำนวน',
  ADDITION: '➕ การบวก',
  SUBTRACTION: '➖ การลบ',
  MULTIPLICATION: '✖️ การคูณ',
  DIVISION: '➗ การหาร',
  FRACTIONS: '🍕 เศษส่วน',
  DECIMALS: '🔢 ทศนิยม',
  PERCENTAGE: '💯 ร้อยละ',
  RATIO: '⚖️ อัตราส่วน',
  GEOMETRY: '📐 เรขาคณิต',
  ALGEBRA: '🧮 พีชคณิต',
  PROBLEM_SOLVING: '🧩 โจทย์ปัญหา',
  MEASUREMENT: '📏 การวัด เวลา และเงิน',
  DATA: '📊 แผนภูมิและข้อมูล',
  EN_ALPHABET: '🔤 ตัวอักษรและเสียง',
  EN_VOCABULARY: '📝 คำศัพท์',
  EN_GRAMMAR: '✏️ ไวยากรณ์',
  EN_COMMUNICATION: '💬 การสื่อสารและการอ่าน',
  SCI_LIFE: '🌿 สิ่งมีชีวิต',
  SCI_PHYSICAL: '⚡ สสารและพลังงาน',
  SCI_EARTH: '🌍 โลกและอวกาศ',
  SCI_INQUIRY: '🔍 ทักษะนักวิทยาศาสตร์',
  TH_LETTERS: 'ก พยัญชนะและสระ',
  TH_READING: '📖 การอ่าน',
  TH_WRITING: '✍️ การเขียน',
  TH_GRAMMAR: '🧱 หลักภาษา',
  TH_LITERATURE: '📜 สำนวนและวรรณกรรม',
  LOG_PATTERNS: '🔁 แบบรูปและลำดับ',
  LOG_CLASSIFY: '🗂️ การจัดกลุ่ม',
  LOG_REASONING: '🕵️ การให้เหตุผล',
  LOG_SPATIAL: '🧭 มิติสัมพันธ์',
  LOG_ALGORITHM: '🤖 การคิดเชิงคำนวณ',
};

export default function DashboardPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  // Bumped when the child switches subject, so the dashboard reloads for that subject.
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (!ready) return;
    api
      .dashboard()
      .then(setDash)
      .catch((err) => setError(handleApiError(err, router)));
  }, [ready, router, subject]);

  if (error) return <main className="page"><div className="error">{error}</div></main>;
  if (!dash) return <Loading />;

  const groups = [...new Set(dash.skills.map((s) => s.group))];
  const earned = dash.achievements.filter((a) => a.earnedAt);

  const updateStudent = async (fn: () => Promise<Student>) => {
    try {
      const student = await fn();
      // The path depends on the goal, so reload the whole dashboard.
      const fresh = await api.dashboard();
      setDash({ ...fresh, student });
    } catch (err) {
      setError(handleApiError(err, router));
    }
  };
  const setGoal = (goal: Goal) => updateStudent(() => api.setGoal(goal));
  const setInterests = (themes: InterestTheme[]) => updateStudent(() => api.setInterests(themes));

  const logout = () => {
    tokenStore.clear();
    router.replace('/');
  };

  return (
    <>
      <TopBar student={dash.student} level={dash.level} character={dash.character} />
      <SubjectSwitcher onChange={setSubject} />
      <main className="page stack">
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <Character look={dash.character} size={40} />
              <h2>
                ความก้าวหน้า{SUBJECT_META[dash.subject]?.nameTh ?? ''}ของ {dash.student.nickname}
              </h2>
            </div>
            <strong style={{ fontSize: 28 }}>{Math.round(dash.overallProgress * 100)}%</strong>
          </div>
          <ProgressBar value={dash.overallProgress} />
        </div>

        <div className="stats">
          <Stat value={`เลเวล ${dash.level.level}`} label={`${dash.xp.toLocaleString()} XP`} />
          <Stat value={`${dash.stats.skillsMastered}/${dash.stats.totalSkills}`} label="ทักษะที่เก่งแล้ว" />
          <Stat value={dash.stats.activitiesCompleted} label="ด่านที่เล่นจบ" />
          <Stat value={`${dash.stats.bossesDefeated} ตัว`} label="บอสที่ปราบได้" />
          <Stat value={`🪙 ${dash.student.coins}`} label="เหรียญ" />
          <Stat value={`${dash.stats.learningMinutesThisWeek} นาที`} label="เวลาเรียนสัปดาห์นี้" />
        </div>

        <div className="grid-2">
          <div className="card stack">
            <h3>💪 เก่งแล้ว</h3>
            {dash.strong.length ? (
              dash.strong.map((s) => <div key={s.code}>✓ {s.nameTh}</div>)
            ) : (
              <p className="muted" style={{ margin: 0 }}>เล่นต่อไปเรื่อย ๆ แล้วทักษะแรกจะมาอยู่ตรงนี้!</p>
            )}
          </div>
          <div className="card stack">
            <h3>🌱 ควรฝึกเพิ่ม</h3>
            {dash.needPractice.length ? (
              dash.needPractice.map((s) => (
                <div key={s.code}>
                  △ {s.nameTh} <span className="muted">({STATUS_LABEL[s.status]})</span>
                </div>
              ))
            ) : (
              <p className="muted" style={{ margin: 0 }}>ยังไม่มี</p>
            )}
            {dash.reviews.length > 0 && (
              <div className="hint">🔁 ถึงเวลาทบทวน: {dash.reviews.map((r) => r.nameTh).join(', ')}</div>
            )}
          </div>
        </div>

        <div className="card stack">
          <h3>🗺️ เส้นทางการเรียนรู้ของฉัน</h3>
          {dash.currentPath.length ? (
            <div className="path">
              {dash.currentPath.map((p, i) => (
                <div key={p.skillCode} className={`path-item ${p.state.toLowerCase()}`}>
                  <span style={{ fontSize: 22 }}>{p.state === 'CURRENT' ? '📍' : p.state === 'LOCKED' ? '🔒' : `${i + 1}.`}</span>
                  <span style={{ flex: 1 }}>{p.nameTh}</span>
                  <span className="muted">{Math.round(p.mastery * 100)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ margin: 0 }}>🎉 หนูเก่งครบทุกทักษะในตอนนี้แล้ว! โลกใหม่กำลังจะมา</p>
          )}
          <Link className="btn" href="/map" style={{ alignSelf: 'flex-start' }}>
            ไปเล่นด่านแนะนำ ▶
          </Link>
        </div>

        <ClassroomCard />

        <div className="grid-2">
          <div className="card stack">
            <h3>🎯 เป้าหมายของฉัน</h3>
            <div className="goal-pick">
              {GOALS.map((g) => (
                <button key={g.value} aria-pressed={dash.student.goal === g.value} onClick={() => setGoal(g.value)}>
                  <span style={{ fontSize: 24 }}>{g.emoji}</span>
                  <span>
                    <strong>{g.label}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: 14 }}>
                      {g.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="card stack">
            <h3>💖 สิ่งที่ฉันชอบ</h3>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              โจทย์จะเป็นเรื่องที่หนูชอบ และระบบจะเรียนรู้เพิ่มจากด่านที่หนูเล่นได้ดี
            </p>
            {dash.student.interests.map((i) => (
              <div className="skill-row" key={i.theme}>
                <span>
                  {THEMES[i.theme].emoji} {THEMES[i.theme].label}
                </span>
                <ProgressBar value={i.level} />
                <span className="muted">{Math.round(i.score)}</span>
              </div>
            ))}
            <InterestPicker value={dash.student.interests.map((i) => i.theme)} onChange={setInterests} />
          </div>
        </div>

        <div className="card stack">
          <h3>🧠 แผนที่ทักษะ</h3>
          {groups.map((g) => (
            <div key={g} className="stack" style={{ gap: 8 }}>
              <strong>{GROUP_LABEL[g] ?? g}</strong>
              {dash.skills
                .filter((s) => s.group === g)
                .map((s) => (
                  <div className="skill-row" key={s.code}>
                    <span>{s.nameTh}</span>
                    <ProgressBar value={s.mastery} tone={masteryTone(s.mastery)} />
                    <span className="muted">{Math.round(s.mastery * 100)}%</span>
                  </div>
                ))}
            </div>
          ))}
        </div>

        <div className="card stack">
          <h3>🏆 รางวัล ({earned.length}/{dash.achievements.length})</h3>
          <div className="achievements">
            {dash.achievements.map((a) => (
              <div key={a.code} className={`achievement${a.earnedAt ? '' : ' locked'}`} title={a.description}>
                <div className="emoji">{a.emoji}</div>
                <strong>{a.name}</strong>
                <div className="muted">{a.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Link className="btn secondary" href="/placement">
            🧭 วัดพลังใหม่
          </Link>
          <button className="btn secondary" onClick={logout}>
            ออกจากระบบ
          </button>
        </div>
      </main>
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
