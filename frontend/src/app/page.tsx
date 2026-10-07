'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InterestPicker } from '@/components/InterestPicker';
import { api, GRADES, tokenStore, type Grade, type InterestTheme } from '@/lib/api';
import { handleApiError } from '@/lib/useRequireAuth';

type Mode = 'welcome' | 'create' | 'login' | 'code';

const FALLBACK_AVATARS = ['🦁', '🐯', '🐼', '🐰', '🦊', '🐸', '🐵', '🦄', '🐲', '🐧', '🐨', '🐙'];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('welcome');
  const [avatars, setAvatars] = useState(FALLBACK_AVATARS);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(FALLBACK_AVATARS[0]);
  const [grade, setGrade] = useState<Grade>('K1');
  const [interests, setInterests] = useState<InterestTheme[]>([]);
  const [code, setCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tokenStore.get()) {
      router.replace('/map');
      return;
    }
    api.avatars().then(setAvatars).catch(() => {});
  }, [router]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.register({ nickname, avatar, grade, interests });
      tokenStore.set(res.token);
      setNewCode(res.loginCode);
      setMode('code');
    } catch (err) {
      setError(handleApiError(err, router));
    } finally {
      setBusy(false);
    }
  };

  const login = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.login(code.trim());
      tokenStore.set(res.token);
      router.replace('/map');
    } catch (err) {
      setError(handleApiError(err, router));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page" style={{ maxWidth: 560, paddingTop: 40 }}>
      <div className="center stack" style={{ marginBottom: 24 }}>
        <div>
          <span className="hero">🌎</span>
        </div>
        <h1>Math World</h1>
        <p className="muted" style={{ margin: 0 }}>
          ผจญภัยในโลกคณิตศาสตร์ เก็บดาว ปลดล็อกด่าน และเก่งขึ้นทุกวัน!
        </p>
      </div>

      {mode === 'welcome' && (
        <div className="stack">
          <button className="btn big" onClick={() => setMode('create')}>
            ✨ เริ่มผจญภัยใหม่
          </button>
          <button className="btn secondary big" onClick={() => setMode('login')}>
            🔑 ฉันมีรหัสแล้ว
          </button>
          <Link href="/grown-ups" className="center muted" style={{ marginTop: 8 }}>
            👨‍👩‍👧 สำหรับผู้ปกครองและคุณครู
          </Link>
        </div>
      )}

      {mode === 'create' && (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <h2>สร้างนักผจญภัย</h2>
          <label className="stack" style={{ gap: 6 }}>
            <span>ชื่อเล่นของหนู</span>
            <input
              className="input"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น น้องมะลิ"
              autoFocus
            />
          </label>
          <div className="stack" style={{ gap: 6 }}>
            <span>เลือกตัวละคร</span>
            <div className="avatar-pick">
              {avatars.map((a) => (
                <button type="button" key={a} aria-pressed={a === avatar} onClick={() => setAvatar(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span>เรียนอยู่ชั้น</span>
            <div className="grade-pick">
              {GRADES.map((g) => (
                <button type="button" key={g.value} aria-pressed={g.value === grade} onClick={() => setGrade(g.value)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span>ชอบอะไรบ้าง? (เลือกได้หลายอย่าง)</span>
            <InterestPicker value={interests} onChange={setInterests} />
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            🔒 เราเก็บแค่ชื่อเล่น ตัวละคร ระดับชั้น และสิ่งที่ชอบเท่านั้น
          </p>
          {error && <div className="error">{error}</div>}
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => setMode('welcome')}>
              กลับ
            </button>
            <button className="btn" style={{ flex: 1 }} disabled={busy || !nickname.trim()}>
              ไปกันเลย! 🚀
            </button>
          </div>
        </form>
      )}

      {mode === 'login' && (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
        >
          <h2>ใส่รหัสนักผจญภัย</h2>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD-1234"
            autoFocus
            style={{ letterSpacing: 3, textAlign: 'center', fontSize: 26 }}
          />
          {error && <div className="error">{error}</div>}
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => setMode('welcome')}>
              กลับ
            </button>
            <button className="btn" style={{ flex: 1 }} disabled={busy || code.trim().length < 8}>
              เข้าสู่โลก 🌎
            </button>
          </div>
        </form>
      )}

      {mode === 'code' && (
        <div className="card stack center">
          <h2>ยินดีต้อนรับ {nickname}! {avatar}</h2>
          <p style={{ margin: 0 }}>นี่คือรหัสลับของหนู ให้ผู้ปกครองช่วยจดเก็บไว้นะ ใช้เข้าเล่นจากเครื่องอื่นได้</p>
          <div className="code-box">{newCode}</div>
          <button className="btn big" onClick={() => router.replace('/placement')}>
            เริ่มภารกิจแรก ⭐
          </button>
        </div>
      )}
    </main>
  );
}
