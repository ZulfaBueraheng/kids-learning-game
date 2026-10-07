'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { AdultBar } from '@/components/AdultBar';
import { Loading } from '@/components/bits';
import { adultApi, SUBJECT_META, type AssignmentState, type ClassroomOverview, type SkillInfo } from '@/lib/api';
import { adultError, useAdult } from '@/lib/useAdult';

const STATE: Record<AssignmentState, { label: string; icon: string }> = {
  DONE: { label: 'ส่งแล้ว', icon: '✅' },
  LATE: { label: 'ส่งช้า', icon: '🕒' },
  PENDING: { label: 'ยังไม่ส่ง', icon: '⏳' },
  OVERDUE: { label: 'เลยกำหนด', icon: '⚠️' },
};

const CELL_HELP = '✓ เก่งแล้ว · △ กำลังฝึก · ✗ ยังไม่เข้าใจ · · ยังไม่เริ่ม';

export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAdult('TEACHER');
  const router = useRouter();
  const [data, setData] = useState<ClassroomOverview | null>(null);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [skillCode, setSkillCode] = useState('');
  const [count, setCount] = useState(8);
  const [due, setDue] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([adultApi.classroom(id), adultApi.skills()])
      .then(([c, s]) => {
        setData(c);
        setSkills(s);
      })
      .catch((err) => setError(adultError(err, router)));
  }, [user, id, router]);

  const run = async (fn: () => Promise<ClassroomOverview>) => {
    setBusy(true);
    setError('');
    try {
      setData(await fn());
    } catch (err) {
      setError(adultError(err, router));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <Loading />;
  if (!data) return error ? <main className="page"><div className="error">{error}</div></main> : <Loading />;

  const { classroom, students, columns, weakSkills, assignments } = data;

  return (
    <>
      <AdultBar user={user} />
      <main className="page wide stack">
        <Link href="/teacher" className="muted">
          ← ห้องเรียนของฉัน
        </Link>
        <div className="card row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h1>{classroom.name}</h1>
            <div className="muted">นักเรียน {students.length} คน</div>
          </div>
          <div className="center">
            <div className="muted" style={{ fontSize: 14 }}>
              ให้นักเรียนใส่รหัสนี้ในหน้า &quot;ความก้าวหน้า&quot;
            </div>
            <div className="code-box">{classroom.joinCode}</div>
          </div>
        </div>
        {error && <div className="error">{error}</div>}

        {weakSkills.length > 0 && (
          <div className="card stack">
            <h3>⚠️ ทักษะที่นักเรียนส่วนใหญ่ยังไม่เข้าใจ</h3>
            {weakSkills.slice(0, 5).map((w) => (
              <div key={w.skillCode} className="row" style={{ justifyContent: 'space-between' }}>
                <span>
                  {w.nameTh}{' '}
                  <span className="muted">
                    ({w.struggling} จาก {w.started} คนที่เริ่มเรียน)
                  </span>
                </span>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => run(() => adultApi.assign(id, { skillCode: w.skillCode, questionCount: 8 }))}
                >
                  มอบหมายฝึกเพิ่ม
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card stack">
          <h3>🧠 แผนที่ทักษะของห้อง</h3>
          <div className="muted" style={{ fontSize: 14 }}>
            {CELL_HELP}
          </div>
          {students.length === 0 ? (
            <p className="muted">ยังไม่มีนักเรียนในห้องนี้</p>
          ) : (
            <div className="matrix-wrap">
              <table className="matrix">
                <thead>
                  <tr>
                    <th scope="col">นักเรียน</th>
                    <th scope="col">เวลา/สัปดาห์</th>
                    {columns.map((c) => (
                      <th key={c.code} scope="col" title={c.nameTh}>
                        <span className="vertical">{c.nameTh}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <th scope="row">
                        <Link href={`/teacher/class/${id}/student/${s.id}`}>
                          {s.avatar} {s.nickname}
                        </Link>
                      </th>
                      <td>{s.minutesThisWeek} นาที</td>
                      {columns.map((c) => (
                        <td key={c.code} className={`cell c${'✓△✗·'.indexOf(s.cells[c.code])}`} title={`${s.nickname} · ${c.nameTh}`}>
                          {s.cells[c.code]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card stack">
          <h3>📚 การบ้าน</h3>
          <form
            className="assign-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() =>
                adultApi.assign(id, {
                  skillCode,
                  questionCount: count,
                  dueAt: due ? new Date(`${due}T23:59:00`).toISOString() : undefined,
                }),
              );
            }}
          >
            <select className="input" value={skillCode} onChange={(e) => setSkillCode(e.target.value)}>
              <option value="">เลือกทักษะ…</option>
              {[...new Set(skills.map((s) => s.subjectCode))].map((subject) => (
                <optgroup key={subject} label={`${SUBJECT_META[subject]?.emoji ?? ''} ${SUBJECT_META[subject]?.nameTh ?? subject}`}>
                  {skills
                    .filter((s) => s.subjectCode === subject)
                    .map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.nameTh}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <label className="row" style={{ gap: 6 }}>
              <span>จำนวนข้อ</span>
              <input className="input" type="number" min={3} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ width: 80 }} />
            </label>
            <label className="row" style={{ gap: 6 }}>
              <span>ส่งภายใน</span>
              <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ width: 170 }} />
            </label>
            <button className="btn" disabled={busy || !skillCode}>
              มอบหมาย
            </button>
          </form>

          {assignments.length === 0 && <p className="muted">ยังไม่มีการบ้าน</p>}
          {assignments.map((a) => (
            <div key={a.id} className="assignment">
              <button className="assignment-head" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                <span>
                  <strong>{a.title}</strong>{' '}
                  <span className="muted">
                    · {a.questionCount} ข้อ
                    {a.dueAt && ` · ส่งภายใน ${new Date(a.dueAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                  </span>
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <span className="badge" style={{ background: 'var(--good)' }}>
                    ส่งแล้ว {a.counts.done + a.counts.late}/{a.results.length}
                  </span>
                  {a.counts.overdue > 0 && <span className="badge boss">เลยกำหนด {a.counts.overdue}</span>}
                </span>
              </button>
              {open === a.id && (
                <div className="stack" style={{ gap: 4, padding: '8px 4px' }}>
                  {a.results.map((r) => (
                    <div key={r.studentId} className="row" style={{ justifyContent: 'space-between' }}>
                      <span>{r.nickname}</span>
                      <span>
                        {STATE[r.state].icon} {STATE[r.state].label}
                        {r.correct != null && <span className="muted"> · ถูก {r.correct}/{r.total}</span>}
                      </span>
                    </div>
                  ))}
                  <button
                    className="btn secondary"
                    style={{ alignSelf: 'flex-start' }}
                    disabled={busy}
                    onClick={() => confirm('ลบการบ้านนี้?') && run(() => adultApi.unassign(id, a.id))}
                  >
                    ลบการบ้าน
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
