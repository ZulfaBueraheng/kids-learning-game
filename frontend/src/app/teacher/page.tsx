'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdultBar } from '@/components/AdultBar';
import { Loading } from '@/components/bits';
import { adultApi, GRADES, type ClassroomSummary, type Grade } from '@/lib/api';
import { adultError, useAdult } from '@/lib/useAdult';

export default function TeacherHome() {
  const user = useAdult('TEACHER');
  const router = useRouter();
  const [classes, setClasses] = useState<ClassroomSummary[] | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    adultApi
      .classrooms()
      .then(setClasses)
      .catch((err) => setError(adultError(err, router)));
  }, [user, router]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const c = await adultApi.createClassroom(name.trim(), grade || undefined);
      setClasses((prev) => [...(prev ?? []), c]);
      setName('');
    } catch (err) {
      setError(adultError(err, router));
    } finally {
      setBusy(false);
    }
  };

  if (!user || !classes) return <Loading />;

  return (
    <>
      <AdultBar user={user} />
      <main className="page stack">
        <h1>ห้องเรียนของฉัน</h1>
        {classes.length === 0 && <p className="muted">ยังไม่มีห้องเรียน สร้างห้องแรกด้านล่าง แล้วให้นักเรียนใส่รหัสห้องในเกม</p>}
        <div className="child-grid">
          {classes.map((c) => (
            <Link key={c.id} href={`/teacher/class/${c.id}`} className="child-card">
              <span style={{ fontSize: 40 }}>🏫</span>
              <strong>{c.name}</strong>
              <span className="muted">
                {c.grade ? GRADES.find((g) => g.value === c.grade)?.label + ' · ' : ''}นักเรียน {c.students} คน · การบ้าน {c.assignments}
              </span>
              <span className="code-chip">รหัสห้อง {c.joinCode}</span>
            </Link>
          ))}
        </div>

        <form
          className="card stack"
          style={{ maxWidth: 520 }}
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <h3>➕ สร้างห้องเรียน</h3>
          <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="เช่น ป.3/1" />
          <select className="input" value={grade} onChange={(e) => setGrade(e.target.value as Grade | '')}>
            <option value="">ไม่ระบุระดับชั้น</option>
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy || !name.trim()}>
            สร้างห้อง
          </button>
        </form>
      </main>
    </>
  );
}
