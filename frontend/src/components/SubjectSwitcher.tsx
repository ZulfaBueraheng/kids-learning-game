'use client';

import { useEffect, useState } from 'react';
import { api, type SubjectProgress } from '@/lib/api';

/**
 * Subject chips under the top bar. Switching tells the server, then lets the
 * page reload its data (map, path and dashboard all follow the active subject).
 */
export function SubjectSwitcher({ onChange }: { onChange: (code: string) => void }) {
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.mySubjects().then(setSubjects).catch(() => {});
  }, []);

  const pick = async (code: string) => {
    if (busy || subjects.find((s) => s.code === code)?.active) return;
    setBusy(true);
    try {
      await api.setSubject(code);
      setSubjects((list) => list.map((s) => ({ ...s, active: s.code === code })));
      onChange(code);
    } finally {
      setBusy(false);
    }
  };

  if (!subjects.length) return null;
  return (
    <nav className="subjects" aria-label="เลือกวิชา">
      {subjects.map((s) => (
        <button key={s.code} aria-pressed={s.active} disabled={busy} onClick={() => pick(s.code)} title={`${s.nameTh} ${Math.round(s.progress * 100)}%`}>
          <span className="emoji">{s.emoji}</span>
          <span className="subject-name">{s.nameTh}</span>
          <span className="subject-bar" aria-hidden="true">
            <span style={{ width: `${Math.round(s.progress * 100)}%` }} />
          </span>
        </button>
      ))}
    </nav>
  );
}
