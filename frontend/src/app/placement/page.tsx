'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ProgressBar, masteryTone } from '@/components/bits';
import { Confetti, Countdown } from '@/components/Celebration';
import { QuestionCard, type Feedback } from '@/components/QuestionCard';
import { api, SUBJECT_META, type Achievement, type PlacementSkill, type Question } from '@/lib/api';
import { sfx } from '@/lib/sfx';
import { handleApiError, useRequireAuth } from '@/lib/useRequireAuth';

const CHEERS_GOOD = ['เยี่ยมมาก! 🌟', 'เก่งจัง! 🎉', 'ถูกต้อง! ✨'];
const CHEERS_TRY = ['ไม่เป็นไร ไปต่อกัน! 💪', 'สู้ ๆ นะ! 🌈', 'ข้อต่อไปลองดูนะ! 😊'];

export default function PlacementPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState({ asked: 0, max: 24 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [result, setResult] = useState<{ skills: PlacementSkill[]; newAchievements: Achievement[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);
  const endCountdown = useCallback(() => setCounting(false), []);

  useEffect(() => {
    if (!ready) return;
    api
      .me()
      .then((me) => setSubject(me.activeSubject))
      .catch(() => {});
  }, [ready]);
  const subjectMeta = subject ? SUBJECT_META[subject] : null;
  const subjectName = subjectMeta?.nameTh ?? '';

  // A fanfare when the quest is complete.
  useEffect(() => {
    if (result) sfx.win();
  }, [result]);

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.startPlacement();
      setAssessmentId(res.assessmentId);
      setQuestion(res.question);
      setProgress(res.progress);
      setCounting(true);
    } catch (err) {
      setError(handleApiError(err, router));
    } finally {
      setBusy(false);
    }
  };

  const answer = async (chosen: string, timeMs: number, hintUsed: boolean) => {
    if (!assessmentId || !question) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.answerPlacement(assessmentId, { questionId: question.id, answer: chosen, timeMs, hintUsed });
      setFeedback({ chosen, isCorrect: !!res.isCorrect });
      if (res.isCorrect) sfx.correct(1);
      else sfx.wrong();
      setProgress(res.progress);
      // Short pause so the child sees the encouragement, then move on.
      setTimeout(() => {
        setFeedback(null);
        setQuestion(res.question);
        if (res.result) setResult(res.result);
        setBusy(false);
      }, 900);
    } catch (err) {
      setError(handleApiError(err, router));
      setBusy(false);
    }
  };

  if (!ready) return null;

  if (result) {
    const tested = result.skills.filter((s) => s.mastery > 0);
    return (
      <main className="page stack" style={{ maxWidth: 640 }}>
        <Confetti />
        <div className="center stack">
          <div>
            <span className="hero">🏆</span>
          </div>
          <h1>ภารกิจสำเร็จ!</h1>
          <p className="muted" style={{ margin: 0 }}>
            นี่คือพลัง{subjectName}ของหนูตอนนี้ เราจะเตรียมด่านที่เหมาะกับหนูไว้ให้
          </p>
        </div>
        <div className="card stack power-result">
          <h3>⚡ พลังของฉัน</h3>
          {tested.map((s, i) => (
            <div className="skill-row" key={s.skillCode} style={{ ['--i' as string]: i }}>
              <span>{s.nameTh}</span>
              <ProgressBar value={s.mastery} tone={masteryTone(s.mastery)} />
              <span className="muted">{Math.round(s.mastery * 100)}%</span>
            </div>
          ))}
        </div>
        {result.newAchievements.length > 0 && (
          <div className="card row">
            {result.newAchievements.map((a) => (
              <div key={a.code} className="row">
                <span style={{ fontSize: 36 }}>{a.emoji}</span>
                <div>
                  <strong>{a.name}</strong>
                  <div className="muted">+{a.xpReward} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link className="btn big" href="/map">
          ไปที่แผนที่โลก 🌎
        </Link>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="page center stack" style={{ maxWidth: 560, paddingTop: 48 }}>
        <div>
          <span className="hero">🧭</span>
        </div>
        <h1>ภารกิจวัดพลัง</h1>
        {subjectMeta && (
          <div className="badge" style={{ alignSelf: 'center' }}>
            {subjectMeta.emoji} {subjectMeta.nameTh}
          </div>
        )}
        <p style={{ margin: 0 }}>
          มาดูกันว่าหนูมีพลัง{subjectName}แค่ไหน! ตอบเท่าที่รู้นะ ไม่ต้องรีบ
          <br />
          ข้อไหนยากไป ระบบจะปรับให้ง่ายลงเอง
        </p>
        {error && <div className="error">{error}</div>}
        <button className="btn big" onClick={start} disabled={busy}>
          เริ่มเลย! 🚀
        </button>
      </main>
    );
  }

  const cheers = feedback?.isCorrect ? CHEERS_GOOD : CHEERS_TRY;
  const charge = Math.min(progress.asked / progress.max, 1);
  return (
    <main className="page stack" style={{ maxWidth: 640 }}>
      <div className="power-panel stack" style={{ gap: 8 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>🧭 ภารกิจวัดพลัง{subjectName}</strong>
          <span className="power-orb" key={progress.asked} aria-hidden>
            🔮
          </span>
        </div>
        <div className="power-meter" role="progressbar" aria-label="พลังที่สะสม" aria-valuenow={Math.round(charge * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.max(charge * 100, 4)}%` }} />
        </div>
        {feedback && (
          <span key={`spark-${progress.asked}`} className="power-spark" aria-hidden>
            +⚡
          </span>
        )}
      </div>
      {counting ? (
        <Countdown onDone={endCountdown} />
      ) : (
        <div className="card">
          <QuestionCard key={question.id} question={question} feedback={feedback} busy={busy} allowHint={false} onAnswer={answer} />
        </div>
      )}
      <div className="center" style={{ minHeight: 40 }}>
        {feedback && (
          <div className={`feedback ${feedback.isCorrect ? 'good' : 'bad'}`}>
            {cheers[progress.asked % cheers.length]}
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </main>
  );
}
