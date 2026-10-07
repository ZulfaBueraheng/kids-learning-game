'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError, type MyAssignment, type MyClassroom } from '@/lib/api';

const STATE_LABEL: Record<MyAssignment['state'], string> = {
  DONE: '✅ ส่งแล้ว',
  LATE: '🕒 ส่งแล้ว (ช้า)',
  PENDING: '⏳ ยังไม่ทำ',
  OVERDUE: '⚠️ เลยกำหนด',
};

/** The child's classes and homework, plus joining a class with the teacher's code. */
export function ClassroomCard() {
  const [classes, setClasses] = useState<MyClassroom[]>([]);
  const [homework, setHomework] = useState<MyAssignment[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.myClassrooms(), api.myAssignments()])
      .then(([c, h]) => {
        setClasses(c);
        setHomework(h);
      })
      .catch(() => {});
  }, []);

  const join = async () => {
    setBusy(true);
    setError('');
    try {
      setClasses(await api.joinClassroom(code.trim()));
      setHomework(await api.myAssignments());
      setCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'เข้าห้องไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <h3>🏫 ห้องเรียนของฉัน</h3>
      {classes.map((c) => (
        <div key={c.id}>
          {c.name} <span className="muted">· {c.teacher}</span>
        </div>
      ))}
      {homework.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <strong>📚 การบ้าน</strong>
          {homework.map((h) => (
            <div key={h.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                {h.title} <span className="muted">· {STATE_LABEL[h.state]}</span>
              </span>
              <Link className="btn secondary" href={`/play/assignment-${h.id}`}>
                {h.state === 'PENDING' || h.state === 'OVERDUE' ? 'ทำเลย ▶' : 'ทำอีกครั้ง'}
              </Link>
            </div>
          ))}
        </div>
      )}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          void join();
        }}
      >
        <input
          className="input"
          style={{ flex: 1, minWidth: 140, letterSpacing: 3 }}
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="รหัสห้องจากคุณครู"
          aria-label="รหัสห้องจากคุณครู"
        />
        <button className="btn" disabled={busy || code.trim().length !== 6}>
          เข้าห้อง
        </button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
