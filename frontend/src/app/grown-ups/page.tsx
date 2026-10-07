'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adultApi, adultTokenStore, type AdultRole } from '@/lib/api';
import { adultError } from '@/lib/useAdult';

export default function GrownUpsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<AdultRole>('PARENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res =
        mode === 'login'
          ? await adultApi.login(email, password)
          : await adultApi.register({ email, password, displayName, role });
      adultTokenStore.set(res.token);
      router.replace(res.user.role === 'PARENT' ? '/parent' : '/teacher');
    } catch (err) {
      setError(adultError(err, router));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page" style={{ maxWidth: 480, paddingTop: 40 }}>
      <div className="center stack" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 56 }}>👨‍👩‍👧 👩‍🏫</div>
        <h1>สำหรับผู้ปกครองและคุณครู</h1>
        <p className="muted" style={{ margin: 0 }}>
          ดูความก้าวหน้าของเด็ก รับคำแนะนำจากข้อมูลการเรียน และมอบหมายการบ้าน
        </p>
      </div>

      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>
            เข้าสู่ระบบ
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>
            สมัครใหม่
          </button>
        </div>

        {mode === 'register' && (
          <>
            <div className="grade-pick" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button type="button" aria-pressed={role === 'PARENT'} onClick={() => setRole('PARENT')}>
                👨‍👩‍👧 ผู้ปกครอง
              </button>
              <button type="button" aria-pressed={role === 'TEACHER'} onClick={() => setRole('TEACHER')}>
                👩‍🏫 คุณครู
              </button>
            </div>
            <label className="stack" style={{ gap: 6 }}>
              <span>ชื่อที่แสดง</span>
              <input className="input" value={displayName} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} placeholder={role === 'PARENT' ? 'เช่น คุณแม่น้องมะลิ' : 'เช่น ครูสมใจ'} />
            </label>
          </>
        )}
        <label className="stack" style={{ gap: 6 }}>
          <span>อีเมล</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <span>รหัสผ่าน {mode === 'register' && <span className="muted">(อย่างน้อย 8 ตัวอักษร)</span>}</span>
          <input
            className="input"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy || !email || password.length < (mode === 'register' ? 8 : 1) || (mode === 'register' && !displayName.trim())}>
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
        </button>
      </form>
      <p className="center">
        <Link href="/" className="muted">
          ← กลับหน้าเด็ก
        </Link>
      </p>
    </main>
  );
}
