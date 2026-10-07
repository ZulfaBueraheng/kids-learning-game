'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdultBar } from '@/components/AdultBar';
import { Loading } from '@/components/bits';
import { adultApi, GRADES, type ChildSummary } from '@/lib/api';
import { adultError, useAdult } from '@/lib/useAdult';

export default function ParentHome() {
  const user = useAdult('PARENT');
  const router = useRouter();
  const [children, setChildren] = useState<ChildSummary[] | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    adultApi
      .children()
      .then(setChildren)
      .catch((err) => setError(adultError(err, router)));
  }, [user, router]);

  const link = async () => {
    setBusy(true);
    setError('');
    try {
      setChildren(await adultApi.linkChild(code.trim()));
      setCode('');
    } catch (err) {
      setError(adultError(err, router));
    } finally {
      setBusy(false);
    }
  };

  if (!user || !children) return <Loading />;

  return (
    <>
      <AdultBar user={user} />
      <main className="page stack">
        <h1>ลูกของฉัน</h1>
        {children.length === 0 && <p className="muted">ยังไม่ได้เชื่อมต่อกับบัญชีของเด็ก ใส่รหัสนักผจญภัยของลูกด้านล่างได้เลย</p>}
        <div className="child-grid">
          {children.map((c) => (
            <Link key={c.id} href={`/parent/child/${c.id}`} className="child-card">
              <span style={{ fontSize: 48 }}>{c.avatar}</span>
              <strong>{c.nickname}</strong>
              <span className="muted">
                {GRADES.find((g) => g.value === c.grade)?.label} · เลเวล {c.level}
              </span>
              <span className="btn" style={{ marginTop: 8 }}>
                ดูรายงาน ▶
              </span>
            </Link>
          ))}
        </div>

        <form
          className="card stack"
          style={{ maxWidth: 520 }}
          onSubmit={(e) => {
            e.preventDefault();
            void link();
          }}
        >
          <h3>➕ เชื่อมต่อบัญชีลูก</h3>
          <p className="muted" style={{ margin: 0 }}>
            ใช้รหัสนักผจญภัยที่ได้ตอนลูกสร้างตัวละคร (เช่น ABCD-1234) เพื่อยืนยันว่าเป็นผู้ปกครองของเด็กคนนี้
          </p>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD-1234"
            style={{ letterSpacing: 3, textAlign: 'center' }}
          />
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy || code.trim().length < 8}>
            เชื่อมต่อ
          </button>
        </form>
      </main>
    </>
  );
}
